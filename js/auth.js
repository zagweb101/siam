/* ============================================================
   auth.js (front-end) — account client + cloud sync helpers
   Stores a JWT + the basic user object in localStorage.
   ============================================================ */
window.Auth = (() => {
  const TKEY = "siam_token", UKEY = "siam_user";

  const getToken = () => localStorage.getItem(TKEY) || "";
  const setToken = (t) => { t ? localStorage.setItem(TKEY, t) : localStorage.removeItem(TKEY); };
  const getUser  = () => { try { return JSON.parse(localStorage.getItem(UKEY) || "null"); } catch { return null; } };
  const setUser  = (u) => { u ? localStorage.setItem(UKEY, JSON.stringify(u)) : localStorage.removeItem(UKEY); };

  function apiBase() {
    let b = ((window.SIAM_CONFIG && SIAM_CONFIG.apiBase) || "").replace(/\/$/, "");
    if (!b && typeof location !== "undefined" && location.protocol.indexOf("http") === 0) b = location.origin;
    return b;
  }

  async function req(pathname, method, body, auth) {
    const headers = { "Content-Type": "application/json" };
    if (auth && getToken()) headers.Authorization = "Bearer " + getToken();
    const r = await fetch(apiBase() + pathname, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw Object.assign(new Error(j.error || ("HTTP " + r.status)), { status: r.status, data: j });
    return j;
  }

  async function register(email, password) {
    const j = await req("/api/auth/register", "POST", { email, password });
    setToken(j.token); setUser(j.user); return j;
  }
  async function login(email, password) {
    const j = await req("/api/auth/login", "POST", { email, password });
    setToken(j.token); setUser(j.user); return j;
  }
  function logout() { setToken(""); setUser(null); }

  async function me() {
    const j = await req("/api/me", "GET", null, true);
    if (j.user) setUser(j.user);
    return j;
  }
  async function saveProfile(profile) { return req("/api/me/profile", "PUT", { profile }, true); }

  return {
    apiBase,
    token: getToken,
    user: getUser,
    isLoggedIn: () => !!getToken(),
    register, login, logout, me, saveProfile,
    setSession: (t, u) => { setToken(t); setUser(u); },
    authHeader: () => (getToken() ? { Authorization: "Bearer " + getToken() } : {}),
  };
})();
