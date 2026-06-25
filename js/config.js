/* ============================================================
   config.js — front-end runtime config
   ------------------------------------------------------------
   The browser only ever needs the PUBLIC Client ID. The secret
   stays on the server. Set apiBase to your backend to enable
   real, server-verified payments. Leave it empty for demo mode.
   ============================================================ */
window.SIAM_CONFIG = {
  // Leave EMPTY to talk to the same server that served the page (works on
  // localhost AND on Railway/any host automatically). Only set this if your
  // API runs on a DIFFERENT domain than the front-end.
  apiBase: "",

  // Public PayPal Client ID (safe to expose) — current LIVE client id.
  paypalClientId: "BAA5JYggEm5m-COj49H4A5_Cis0kL7YV7SeE6gbpNt_9CaqqDVH77F2WdyxB73UObTAaG4OTBGugE0CggY",

  // "sandbox" while testing, "live" for production.
  paypalEnv: "live",

  // Recurring plan ids (from `npm run setup-plans`). Hardcoded so the
  // PayPal subscription button never depends on a config fetch finishing first.
  planMonthlyId: "P-3EW61213AA840122SNI6WSGY",
  planYearlyId: "P-87U827837S8781716NI6WSHA",

  currency: "USD",
};
