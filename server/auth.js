/* ============================================================
   auth.js — password hashing (scrypt) + JWT (HMAC-SHA256)
   Uses only Node's built-in `crypto`. No external dependencies.
   ============================================================ */
import crypto from "node:crypto";

/* JWT_SECRET is read lazily (on first use) so that dotenv.config() in
   server.js has already loaded .env by the time we need it. In ESM all
   top-level imports run before any code in the importer. */
let _jwtSecret = null;
let _warned = false;
function getJwtSecret() {
  if (!_jwtSecret) {
    _jwtSecret = process.env.JWT_SECRET
      || crypto.createHash("sha256").update("siam-dev-" + (process.env.PAYPAL_CLIENT_ID || "local")).digest("hex");
    if (!process.env.JWT_SECRET && !_warned) {
      _warned = true;
      console.warn("⚠️  JWT_SECRET not set — using a derived dev secret. Set JWT_SECRET in production.");
    }
  }
  return _jwtSecret;
}
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

/* ---------- password hashing (scrypt) ---------- */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
export function verifyPassword(password, stored) {
  try {
    const [salt, derived] = String(stored).split(":");
    const test = crypto.scryptSync(String(password), salt, 64).toString("hex");
    const a = Buffer.from(test, "hex"), b = Buffer.from(derived, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

/* ---------- JWT (compact HS256) ---------- */
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const b64uJSON = (obj) => b64u(JSON.stringify(obj));

export function signToken(payload) {
  const header = b64uJSON({ alg: "HS256", typ: "JWT" });
  const body = b64uJSON({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL });
  const data = `${header}.${body}`;
  const sig = crypto.createHmac("sha256", getJwtSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}
export function verifyToken(token) {
  try {
    const [header, body, sig] = String(token).split(".");
    if (!header || !body || !sig) return null;
    const expected = crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}

/* ---------- express middleware ---------- */
export function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload || !payload.uid) return res.status(401).json({ error: "unauthorized" });
  req.userId = payload.uid;
  req.userEmail = payload.email;
  next();
}

/* optional auth: sets req.userId if a valid token is present, else continues */
export function authOptional(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  const payload = token && verifyToken(token);
  if (payload && payload.uid) { req.userId = payload.uid; req.userEmail = payload.email; }
  next();
}

export function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "")); }
