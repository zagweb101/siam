/* ============================================================
   config.js — front-end runtime config
   ------------------------------------------------------------
   The browser only ever needs the PUBLIC Client ID. The secret
   stays on the server.
   ------------------------------------------------------------
   ⚙️ SANDBOX MODE — LIVE temporarily disabled.
   The sandbox Client ID and plan IDs come from the server
   (/api/config), which reads Railway's PAYPAL_* variables. The
   frontend hardcodes nothing live, so no live payment can fire.

   To re-enable LIVE later:
     • paypalEnv: "live"
     • paypalClientId: "BAA5JYggEm5m-COj49H4A5_Cis0kL7YV7SeE6gbpNt_9CaqqDVH77F2WdyxB73UObTAaG4OTBGugE0CggY"
     • planMonthlyId: "P-3EW61213AA840122SNI6WSGY"
     • planYearlyId:  "P-87U827837S8781716NI6WSHA"
     • set live PAYPAL_* on Railway (PAYPAL_ENV=live).
   ============================================================ */
window.SIAM_CONFIG = {
  // Empty → same origin that served the page (works on Railway automatically).
  apiBase: "",

  // Pulled from the server (/api/config). Empty here = use whatever the
  // sandbox server provides; guarantees the live key is never used.
  paypalClientId: "",

  // "sandbox" while testing, "live" for production.
  paypalEnv: "sandbox",

  // Empty → no recurring plan ids → checkout uses one-time SANDBOX orders
  // (which work without plan setup). Add sandbox plan ids for subscriptions.
  planMonthlyId: "",
  planYearlyId: "",

  currency: "USD",
};
