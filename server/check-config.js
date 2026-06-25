/* ============================================================
   check-config.js — diagnose PayPal credentials.
   Tries to authenticate against BOTH sandbox and live, and
   tells you which environment your keys belong to.
   Run:  node check-config.js     (does NOT print your secret)
   ============================================================ */
import dotenv from "dotenv";
dotenv.config();

const { PAYPAL_CLIENT_ID = "", PAYPAL_SECRET = "", PAYPAL_ENV = "sandbox" } = process.env;

function mask(s){ return s ? s.slice(0,6) + "…" + s.slice(-4) + ` (len ${s.length})` : "(empty)"; }

console.log("\n— Siam PayPal config check —");
console.log("PAYPAL_ENV     :", PAYPAL_ENV);
console.log("PAYPAL_CLIENT_ID:", mask(PAYPAL_CLIENT_ID));
console.log("PAYPAL_SECRET  :", mask(PAYPAL_SECRET));

if(!PAYPAL_CLIENT_ID || !PAYPAL_SECRET){
  console.log("\n❌ Client ID or Secret is empty in .env.");
  process.exit(1);
}
if(/\s/.test(PAYPAL_CLIENT_ID) || /\s/.test(PAYPAL_SECRET)){
  console.log("\n⚠️  Warning: a key contains a space/newline — re-copy it cleanly.");
}

async function tryEnv(name, base){
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  try{
    const r = await fetch(`${base}/v1/oauth2/token`, {
      method:"POST",
      headers:{ Authorization:`Basic ${auth}`, "Content-Type":"application/x-www-form-urlencoded" },
      body:"grant_type=client_credentials",
    });
    const d = await r.json().catch(()=>({}));
    if(r.ok && d.access_token) return { name, ok:true };
    return { name, ok:false, err:d.error || ("HTTP "+r.status) };
  }catch(e){ return { name, ok:false, err:"network: "+e.message }; }
}

(async () => {
  const [sb, lv] = await Promise.all([
    tryEnv("sandbox", "https://api-m.sandbox.paypal.com"),
    tryEnv("live",    "https://api-m.paypal.com"),
  ]);
  console.log("\nResult:");
  console.log("  sandbox:", sb.ok ? "✅ keys valid" : "❌ " + sb.err);
  console.log("  live   :", lv.ok ? "✅ keys valid" : "❌ " + lv.err);

  const good = sb.ok ? "sandbox" : lv.ok ? "live" : null;
  console.log("");
  if(!good){
    console.log("➡️  Neither worked. The Client ID and Secret are not a matching pair,");
    console.log("    or the Secret was copied incompletely. Re-copy BOTH from the SAME app card.");
  } else if(good !== PAYPAL_ENV){
    console.log(`➡️  Your keys are **${good}** keys, but PAYPAL_ENV=${PAYPAL_ENV}.`);
    console.log(`    Fix: set  PAYPAL_ENV=${good}  in .env  (or use ${PAYPAL_ENV} keys instead).`);
  } else {
    console.log(`✅ All good — your ${good} keys match PAYPAL_ENV. Run: npm run setup-plans`);
  }
})();
