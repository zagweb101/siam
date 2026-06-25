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
} = process.env;

const isProd = NODE_ENV === "production";

const BASE = PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const configured = Boolean(PAYPAL_CLIENT_ID && PAYPAL_SECRET);
if (!configured) {
  console.warn("\n⚠️  PayPal credentials missing. Copy .env.example → .env and fill PAYPAL_CLIENT_ID / PAYPAL_SECRET.");
  console.warn("    The server still boots so you can develop the front-end, but payment endpoints will return 503.\n");
}

const app = express();

/* ---- Security: Helmet (HTTP security headers) ---- */
app.use(helmet({
  contentSecurityPolicy: false,      // we load external fonts/images/PayPal SDK
  crossOriginEmbedderPolicy: false,  // PayPal iframes need this
}));

/* ---- Logging: Morgan ---- */
app.use(morgan(isProd ? "combined" : "dev"));

/* ---- HTTPS redirect (production only, behind proxy like Railway) ---- */
if (isProd) {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
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
  const { email, password } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: "invalid_email" });
  if (!password || String(password).length < 6) return res.status(400).json({ error: "weak_password" });
  try {
    if (await db.getUserByEmail(email)) return res.status(409).json({ error: "email_taken" });
    const user = await db.createUser(email, hashPassword(password));
    res.json({ token: signToken({ uid: user.id, email: user.email }), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const u = await db.getUserByEmail(email);
    if (!u || !verifyPassword(password, u.password_hash)) return res.status(401).json({ error: "bad_credentials" });
    res.json({ token: signToken({ uid: u.id, email: u.email }), user: { id: u.id, email: u.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/me", authRequired, async (req, res) => {
  try {
    const [profile, pro] = await Promise.all([db.getProfile(req.userId), db.isPro(req.userId)]);
    res.json({ user: { id: req.userId, email: req.userEmail }, profile, pro });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/me/profile", authRequired, async (req, res) => {
  const data = req.body && req.body.profile;
  if (!data || typeof data !== "object") return res.status(400).json({ error: "no_profile" });
  try { await db.saveProfile(req.userId, data); res.json({ ok: true }); }
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
    const { ok, data } = await pp(`/v2/checkout/orders/${req.params.id}/capture`, "POST");
    if (!ok) return res.status(502).json({ error: "capture_failed", details: data });
    if (data.status === "COMPLETED") {
      await db.setSubscription(req.userId, { status: "COMPLETED", source: "order", ref: data.id });
      return res.json({ status: "COMPLETED", pro: true, id: data.id });
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
    if (active) await db.setSubscription(req.userId, { status: data.status, source: "subscription", ref: id, planId: data.plan_id });
    res.json({ status: data.status, pro: active });
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
        await db.setSubscription(uid, { status: "ACTIVE", source: "webhook", ref: resource.id, planId: resource.plan_id });
      } else if (event === "BILLING.SUBSCRIPTION.CANCELLED" || event === "BILLING.SUBSCRIPTION.EXPIRED") {
        await db.setSubscription(uid, { status: "CANCELLED", source: "webhook", ref: resource.id });
      }
    }
    console.log("webhook:", event, "user:", uid || "-");
    res.sendStatus(200);
  } catch (e) { console.error("webhook error", e.message); res.sendStatus(500); }
});

/* entitlement check (front-end can poll this) */
app.get("/api/entitlement/:userId", async (req, res) => {
  res.json({ pro: await db.isPro(req.params.userId) });
});

/* ---- serve the front-end (single deploy) ---- */
app.use(express.static(path.join(__dirname, "..")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "..", "index.html")));

db.init()
  .then(() => app.listen(PORT, () => {
    console.log(`\n🌿 Siam server on http://localhost:${PORT}  [${PAYPAL_ENV}]  configured=${configured}\n`);
  }))
  .catch((err) => { console.error("❌ DB init failed:", err.message); process.exit(1); });
