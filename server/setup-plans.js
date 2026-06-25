/* ============================================================
   setup-plans.js — one-off: create a Product + monthly & yearly
   billing plans in PayPal, then print the plan ids to put in .env.
   Run:  npm run setup-plans
   ============================================================ */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const {
  PAYPAL_ENV = "sandbox",
  PAYPAL_CLIENT_ID, PAYPAL_SECRET,
  PRICE_MONTHLY = "4.99", PRICE_YEARLY = "35.88", CURRENCY = "USD",
} = process.env;

const BASE = PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error("❌ Fill PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env first.");
  process.exit(1);
}

async function token() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return d.access_token;
}
async function api(ep, body) {
  const t = await token();
  const r = await fetch(`${BASE}${ep}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return d;
}

function plan(productId, name, price, interval) {
  return {
    product_id: productId,
    name,
    billing_cycles: [{
      frequency: { interval_unit: interval, interval_count: 1 },
      tenure_type: "REGULAR", sequence: 1, total_cycles: 0,
      pricing_scheme: { fixed_price: { value: price, currency_code: CURRENCY } },
    }],
    payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
  };
}

(async () => {
  console.log(`Creating product & plans in PayPal [${PAYPAL_ENV}] ...`);
  const product = await api("/v1/catalogs/products", {
    name: "Siam Pro", description: "Siam intermittent-fasting premium", type: "SERVICE", category: "SOFTWARE",
  });
  console.log("✓ product:", product.id);

  const monthly = await api("/v1/billing/plans", plan(product.id, "Siam Pro Monthly", PRICE_MONTHLY, "MONTH"));
  const yearly  = await api("/v1/billing/plans", plan(product.id, "Siam Pro Yearly", PRICE_YEARLY, "YEAR"));

  console.log("\n✅ Add these to your .env:\n");
  console.log("PLAN_MONTHLY_ID=" + monthly.id);
  console.log("PLAN_YEARLY_ID=" + yearly.id + "\n");
})().catch(e => { console.error("❌", e.message); process.exit(1); });
