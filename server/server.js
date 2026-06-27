/* ============================================================
   Siam server — PayPal payments & subscriptions
   The PayPal SECRET is read from environment variables only.
   It is NEVER sent to the browser. Front-end gets the Client ID.
   ============================================================ */
import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import webpush from "web-push";
import { z } from "zod";
import * as db from "./db.js";
import { hashPassword, verifyPassword, signToken, authRequired, isValidEmail } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// load server/.env no matter which folder we're started from (Railway uses
// dashboard env vars instead, in which case this simply finds nothing).
dotenv.config({ path: path.join(__dirname, ".env") });

const {
  PAYPAL_ENV = "sandbox",
  PAYPAL_CLIENT_ID = "",
  PAYPAL_SECRET = "",
  PAYPAL_WEBHOOK_ID = "",
  PLAN_MONTHLY_ID = "",
  PLAN_YEARLY_ID = "",
  PRICE_MONTHLY = "4.99",
  PRICE_YEARLY = "35.88",
  CURRENCY = "USD",
  PORT = 3000,
  ALLOWED_ORIGINS = "",
  NODE_ENV = "development",
  VAPID_PUBLIC_KEY = "",
  VAPID_PRIVATE_KEY = "",
  VAPID_SUBJECT = "https://siam-production-61f9.up.railway.app",
} = process.env;

const isProd = NODE_ENV === "production";

/* ---- Web Push (VAPID) — background break-fast reminders ---- */
const pushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushEnabled) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); }
  catch (e) { console.warn("VAPID setup failed:", e.message); }
} else {
  console.warn("⚠️  Web Push disabled — set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY to enable background reminders.");
}

/* ---- zod input schemas ---- */
const credSchema = z.object({ email: z.string().email(), password: z.string().min(6).max(200) });
const loginSchema = z.object({ email: z.string().min(3), password: z.string().min(1) });
const pushSchema = z.object({
  subscription: z.object({ endpoint: z.string().url() }).passthrough(),
  fireAt: z.union([z.string(), z.number()]).nullable().optional(),
});

const BASE = PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const configured = Boolean(PAYPAL_CLIENT_ID && PAYPAL_SECRET);
if (!configured) {
  console.warn("\n⚠️  PayPal credentials missing. Copy .env.example → .env and fill PAYPAL_CLIENT_ID / PAYPAL_SECRET.");
  console.warn("    The server still boots so you can develop the front-end, but payment endpoints will return 503.\n");
}

const app = express();

/* ---- Security: Helmet (HTTP security headers) ----
   A real CSP that allows exactly what the app needs:
   - PayPal SDK (scripts/iframes/connections to *.paypal.com / *.paypalobjects.com)
   - Google Fonts (style + font hosts), inline styles (the UI uses style="" heavily)
   - content APIs: TheMealDB, wger, Wikipedia
   The app has NO inline <script> of its own, so script-src omits 'unsafe-inline'. */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://*.paypal.com", "https://*.paypalobjects.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": [
        "'self'",
        "https://*.paypal.com",
        "https://www.themealdb.com",
        "https://wger.de",
        "https://*.wikipedia.org",
        "https://*.wikimedia.org",
      ],
      "frame-src": ["https://*.paypal.com"],
      "worker-src": ["'self'", "blob:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'", "https://*.paypal.com"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  crossOriginEmbedderPolicy: false,  // PayPal iframes need this
}));

/* ---- Logging: Morgan ---- */
app.use(morgan(isProd ? "combined" : "dev"));

/* ---- HTTPS redirect (production only, behind proxy like Railway) ---- */
if (isProd) {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

/* ---- Rate Limiting ---- */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                  // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                   // max 20 auth attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

/* ---- CORS (allowlist) ---- */
const origins = ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && (origins.length === 0 || origins.includes(o))) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// keep raw body for webhook signature verification
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

/* ---- PayPal access token (cached) ---- */
let tokenCache = { value: null, exp: 0 };
async function getToken() {
  if (!configured) throw new Error("PayPal not configured");
  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await r.json();
  if (!r.ok) throw new Error("token: " + JSON.stringify(data));
  tokenCache = { value: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.value;
}

async function pp(endpoint, method = "GET", body) {
  const token = await getToken();
  const r = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

const needPaypal = (_req, res, next) => configured ? next()
  : res.status(503).json({ error: "PayPal not configured on server. Fill .env." });

/* ===========================================================
   AUTH — register / login / me / profile sync
   =========================================================== */
app.post("/api/auth/register", async (req, res) => {
  const parsed = credSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const bad = parsed.error.issues[0];
    return res.status(400).json({ error: bad.path[0] === "email" ? "invalid_email" : "weak_password" });
  }
  const { email, password } = parsed.data;
  try {
    if (await db.getUserByEmail(email)) return res.status(409).json({ error: "email_taken" });
    const user = await db.createUser(email, hashPassword(password));
    res.json({ token: signToken({ uid: user.id, email: user.email }), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "bad_credentials" });
  const { email, password } = parsed.data;
  try {
    const u = await db.getUserByEmail(email);
    if (!u || !verifyPassword(password, u.password_hash)) return res.status(401).json({ error: "bad_credentials" });
    res.json({ token: signToken({ uid: u.id, email: u.email }), user: { id: u.id, email: u.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/me", authRequired, async (req, res) => {
  try {
    const [profile, pro, s] = await Promise.all([
      db.getProfile(req.userId), db.isPro(req.userId), db.getSubscription(req.userId),
    ]);
    const sub = s ? { status: s.status, planId: s.plan_id || null, expiresAt: s.expires_at || null } : null;
    res.json({ user: { id: req.userId, email: req.userEmail }, profile, pro, sub });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/me/profile", authRequired, async (req, res) => {
  const data = req.body && req.body.profile;
  if (!data || typeof data !== "object") return res.status(400).json({ error: "no_profile" });
  try { await db.saveProfile(req.userId, data); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* ===========================================================
   WEB PUSH — public key + subscribe/cancel for break-fast reminders
   =========================================================== */
app.get("/api/push/key", (_req, res) => res.json({ enabled: pushEnabled, key: VAPID_PUBLIC_KEY }));

app.post("/api/push/subscribe", authRequired, async (req, res) => {
  if (!pushEnabled) return res.status(503).json({ error: "push_disabled" });
  const parsed = pushSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "bad_subscription" });
  try {
    await db.setPush(req.userId, parsed.data.subscription, parsed.data.fireAt || null);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/push/cancel", authRequired, async (req, res) => {
  try { await db.clearPushFire(req.userId); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- public config for the front-end (NO secret) ---- */
app.get("/api/config", (_req, res) => {
  res.json({
    configured,
    env: PAYPAL_ENV,
    clientId: PAYPAL_CLIENT_ID,            // public — safe to expose
    planMonthly: PLAN_MONTHLY_ID,
    planYearly: PLAN_YEARLY_ID,
    prices: { monthly: PRICE_MONTHLY, yearly: PRICE_YEARLY, currency: CURRENCY },
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, env: PAYPAL_ENV, configured }));

/* ---- subscription period helpers (so the plan ends at its due date) ---- */
const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
const daysForPlanKey = (plan) => (plan === "yearly" ? 365 : 30);
const daysForPlanId  = (planId) => (planId && planId === PLAN_YEARLY_ID ? 365 : 30);

/* ===========================================================
   ONE-TIME ORDERS
   =========================================================== */
app.post("/api/orders", needPaypal, authRequired, async (req, res) => {
  try {
    const plan = req.body?.plan === "yearly" ? "yearly" : "monthly";
    const value = plan === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;
    const { ok, data } = await pp("/v2/checkout/orders", "POST", {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: CURRENCY, value },
        description: `Siam Pro (${plan})`,
      }],
    });
    if (!ok) return res.status(502).json({ error: "create_order_failed", details: data });
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/orders/:id/capture", needPaypal, authRequired, async (req, res) => {
  try {
    const plan = req.body?.plan === "yearly" ? "yearly" : "monthly";
    const { ok, data } = await pp(`/v2/checkout/orders/${req.params.id}/capture`, "POST");
    if (!ok) return res.status(502).json({ error: "capture_failed", details: data });
    if (data.status === "COMPLETED") {
      const expiresAt = addDays(daysForPlanKey(plan));   // access ends at the due date
      await db.setSubscription(req.userId, { status: "COMPLETED", source: "order", ref: data.id, expiresAt });
      return res.json({ status: "COMPLETED", pro: true, id: data.id, expiresAt });
    }
    res.status(402).json({ status: data.status, pro: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ===========================================================
   RECURRING SUBSCRIPTIONS
   The button calls createSubscription on the client with a plan_id;
   here we verify it is ACTIVE before granting Pro.
   =========================================================== */
app.post("/api/subscriptions/verify", needPaypal, authRequired, async (req, res) => {
  try {
    const id = req.body?.subscriptionID;
    if (!id) return res.status(400).json({ error: "missing subscriptionID" });
    const { ok, data } = await pp(`/v1/billing/subscriptions/${id}`, "GET");
    if (!ok) return res.status(502).json({ error: "verify_failed", details: data });
    const active = data.status === "ACTIVE" || data.status === "APPROVED";
    if (active) {
      // prefer PayPal's real next-billing date; fall back to plan period
      const expiresAt = data.billing_info?.next_billing_time || addDays(daysForPlanId(data.plan_id));
      await db.setSubscription(req.userId, { status: data.status, source: "subscription", ref: id, planId: data.plan_id, expiresAt });
      return res.json({ status: data.status, pro: true, expiresAt });
    }
    res.json({ status: data.status, pro: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ===========================================================
   WEBHOOK — verifies the event signature with PayPal, then
   updates entitlements (the source of truth for renewals/cancels).
   =========================================================== */
app.post("/api/webhook", needPaypal, async (req, res) => {
  try {
    if (!PAYPAL_WEBHOOK_ID) { console.warn("webhook received but PAYPAL_WEBHOOK_ID not set"); return res.sendStatus(200); }
    const v = await pp("/v1/notifications/verify-webhook-signature", "POST", {
      auth_algo: req.headers["paypal-auth-algo"],
      cert_url: req.headers["paypal-cert-url"],
      transmission_id: req.headers["paypal-transmission-id"],
      transmission_sig: req.headers["paypal-transmission-sig"],
      transmission_time: req.headers["paypal-transmission-time"],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: req.body,
    });
    if (v.data?.verification_status !== "SUCCESS") { console.warn("webhook signature invalid"); return res.sendStatus(400); }

    const event = req.body?.event_type;
    const resource = req.body?.resource || {};
    const uid = Number(resource.custom_id);
    if (uid) {
      if (event === "BILLING.SUBSCRIPTION.ACTIVATED" || event === "PAYMENT.SALE.COMPLETED") {
        // new period paid → extend access to the next due date
        const expiresAt = resource.billing_info?.next_billing_time || addDays(daysForPlanId(resource.plan_id));
        await db.setSubscription(uid, { status: "ACTIVE", source: "webhook", ref: resource.id, planId: resource.plan_id, expiresAt });
      } else if (event === "BILLING.SUBSCRIPTION.CANCELLED") {
        // cancelled but keep access until the already-paid period ends
        const cur = await db.getSubscription(uid);
        await db.setSubscription(uid, { status: "CANCELLED", source: "webhook", ref: resource.id, planId: cur && cur.plan_id, expiresAt: cur && cur.expires_at });
      } else if (event === "BILLING.SUBSCRIPTION.EXPIRED") {
        await db.setSubscription(uid, { status: "EXPIRED", source: "webhook", ref: resource.id, expiresAt: new Date().toISOString() });
      }
    }
    console.log("webhook:", event, "user:", uid || "-");
    res.sendStatus(200);
  } catch (e) { console.error("webhook error", e.message); res.sendStatus(500); }
});

/* entitlement check — authenticated; a user can only read their own status.
   (The front-end normally gets `pro` from /api/me; this is a lightweight poll.) */
app.get("/api/entitlement", authRequired, async (req, res) => {
  res.json({ pro: await db.isPro(req.userId) });
});

/* ---- unknown API routes → JSON 404 (never the SPA HTML) ---- */
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

/* ---- break-fast reminder scheduler (runs every minute) ---- */
async function sendDuePush() {
  if (!pushEnabled) return;
  try {
    const due = await db.getDuePush();
    for (const { userId, sub } of due) {
      const payload = JSON.stringify({ title: "🎉 حان موعد الإفطار · Break your fast", body: "أكملت صيامك — افتح نافذة الأكل بصحة. You completed your fast!" });
      try { await webpush.sendNotification(sub, payload); }
      catch (err) { if (err && (err.statusCode === 404 || err.statusCode === 410)) await db.removePush(userId); }
      await db.clearPushFire(userId);
    }
  } catch (e) { console.warn("push scheduler:", e.message); }
}
if (pushEnabled) setInterval(sendDuePush, 60 * 1000);

/* ---- serve the front-end (single deploy) ---- */
app.use(express.static(path.join(__dirname, "..")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "..", "index.html")));

db.init()
  .then(() => app.listen(PORT, () => {
    console.log(`\n🌿 Siam server on http://localhost:${PORT}  [${PAYPAL_ENV}]  configured=${configured}\n`);
  }))
  .catch((err) => { console.error("❌ DB init failed:", err.message); process.exit(1); });
