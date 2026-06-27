/* ============================================================
   db.js — data layer for Siam
   ------------------------------------------------------------
   • If DATABASE_URL is set  → PostgreSQL (Railway).  `pg` is
     imported dynamically so local dev doesn't need it installed.
   • Otherwise               → a local JSON file (server/data.local.json)
     so you can develop with zero database setup.

   Tables / shapes:
     users         : id, email (unique), password_hash, created_at
     profiles      : user_id (pk), data (jsonb)   ← answers + plan
     subscriptions : user_id (pk), status, source, ref, plan_id, updated_at
   ============================================================ */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL || "";
const FILE = path.join(__dirname, "data.local.json");

let pool = null;            // pg pool when in Postgres mode
const usingPg = Boolean(DATABASE_URL);

/* ---------------- JSON-file backend helpers ---------------- */
function fileRead() {
  try { const d = JSON.parse(fs.readFileSync(FILE, "utf8")); if(!d.push) d.push={}; return d; }
  catch { return { seq: 0, users: [], profiles: {}, subs: {}, push: {} }; }
}
function fileWrite(d) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

/* ---------------- init ---------------- */
export async function init() {
  if (usingPg) {
    const pg = await import("pg");
    const ssl = /localhost|127\.0\.0\.1|\.internal/.test(DATABASE_URL)
      ? false : { rejectUnauthorized: false };
    pool = new pg.default.Pool({ connectionString: DATABASE_URL, ssl });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data    JSONB NOT NULL DEFAULT '{}'::jsonb
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        status     TEXT,
        source     TEXT,
        ref        TEXT,
        plan_id    TEXT,
        expires_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
      CREATE TABLE IF NOT EXISTS push_subs (
        user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sub        JSONB NOT NULL,
        fire_at    TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("🗄️  Postgres connected");
  } else {
    if (!fs.existsSync(FILE)) fileWrite({ seq: 0, users: [], profiles: {}, subs: {} });
    console.log("🗄️  Local JSON store:", FILE, "(set DATABASE_URL for Postgres)");
  }
}

/* ---------------- users ---------------- */
export async function createUser(email, passwordHash) {
  email = String(email).toLowerCase().trim();
  if (usingPg) {
    const r = await pool.query(
      "INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",
      [email, passwordHash]);
    return r.rows[0];
  }
  const d = fileRead();
  if (d.users.some(u => u.email === email)) throw new Error("duplicate");
  const user = { id: ++d.seq, email, password_hash: passwordHash, created_at: new Date().toISOString() };
  d.users.push(user); fileWrite(d);
  return { id: user.id, email: user.email };
}

export async function getUserByEmail(email) {
  email = String(email).toLowerCase().trim();
  if (usingPg) {
    const r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return r.rows[0] || null;
  }
  return fileRead().users.find(u => u.email === email) || null;
}

export async function getUserById(id) {
  id = Number(id);
  if (usingPg) {
    const r = await pool.query("SELECT id,email FROM users WHERE id=$1", [id]);
    return r.rows[0] || null;
  }
  const u = fileRead().users.find(u => u.id === id);
  return u ? { id: u.id, email: u.email } : null;
}

/* ---------------- profiles (answers + plan) ---------------- */
export async function getProfile(userId) {
  userId = Number(userId);
  if (usingPg) {
    const r = await pool.query("SELECT data FROM profiles WHERE user_id=$1", [userId]);
    return r.rows[0] ? r.rows[0].data : null;
  }
  return fileRead().profiles[userId] || null;
}

export async function saveProfile(userId, data) {
  userId = Number(userId);
  if (usingPg) {
    await pool.query(
      `INSERT INTO profiles(user_id,data) VALUES($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET data=$2`,
      [userId, data]);
    return;
  }
  const d = fileRead(); d.profiles[userId] = data; fileWrite(d);
}

/* ---------------- subscriptions / entitlements ---------------- */
export async function setSubscription(userId, { status, source, ref, planId, expiresAt }) {
  userId = Number(userId);
  const exp = expiresAt ? new Date(expiresAt).toISOString() : null;
  if (usingPg) {
    await pool.query(
      `INSERT INTO subscriptions(user_id,status,source,ref,plan_id,expires_at,updated_at)
       VALUES($1,$2,$3,$4,$5,$6,now())
       ON CONFLICT (user_id) DO UPDATE SET status=$2,source=$3,ref=$4,plan_id=$5,expires_at=$6,updated_at=now()`,
      [userId, status, source, ref || null, planId || null, exp]);
    return;
  }
  const d = fileRead();
  d.subs[userId] = { status, source, ref: ref || null, plan_id: planId || null, expires_at: exp, updated_at: new Date().toISOString() };
  fileWrite(d);
}

export async function getSubscription(userId) {
  userId = Number(userId);
  if (usingPg) {
    const r = await pool.query("SELECT * FROM subscriptions WHERE user_id=$1", [userId]);
    return r.rows[0] || null;
  }
  return fileRead().subs[userId] || null;
}

/* Pro entitlement = a subscription whose paid period has not ended yet.
   The plan ends exactly at expires_at (the due date), so one-time orders no
   longer grant Pro forever, and cancelled subs keep access until period end. */
export async function isPro(userId) {
  const s = await getSubscription(userId);
  if (!s) return false;
  if (s.status === "EXPIRED") return false;
  const exp = s.expires_at ? new Date(s.expires_at).getTime() : null;
  return Boolean(exp && exp > Date.now());
}

/* ---------------- web push subscriptions ---------------- */
export async function setPush(userId, sub, fireAt) {
  userId = Number(userId);
  const fa = fireAt ? new Date(fireAt).toISOString() : null;
  if (usingPg) {
    await pool.query(
      `INSERT INTO push_subs(user_id,sub,fire_at,updated_at) VALUES($1,$2,$3,now())
       ON CONFLICT (user_id) DO UPDATE SET sub=$2,fire_at=$3,updated_at=now()`,
      [userId, sub, fa]);
    return;
  }
  const d = fileRead(); d.push[userId] = { sub, fire_at: fa }; fileWrite(d);
}
export async function clearPushFire(userId) {
  userId = Number(userId);
  if (usingPg) { await pool.query("UPDATE push_subs SET fire_at=NULL WHERE user_id=$1", [userId]); return; }
  const d = fileRead(); if (d.push[userId]) { d.push[userId].fire_at = null; fileWrite(d); }
}
export async function removePush(userId) {
  userId = Number(userId);
  if (usingPg) { await pool.query("DELETE FROM push_subs WHERE user_id=$1", [userId]); return; }
  const d = fileRead(); delete d.push[userId]; fileWrite(d);
}
/* due reminders (fire_at reached) → [{userId, sub}] */
export async function getDuePush() {
  if (usingPg) {
    const r = await pool.query("SELECT user_id, sub FROM push_subs WHERE fire_at IS NOT NULL AND fire_at <= now()");
    return r.rows.map(x => ({ userId: x.user_id, sub: x.sub }));
  }
  const d = fileRead(); const now = Date.now(); const out = [];
  for (const uid in d.push) { const p = d.push[uid]; if (p.fire_at && new Date(p.fire_at).getTime() <= now) out.push({ userId: Number(uid), sub: p.sub }); }
  return out;
}

/* small helper used by auth.js */
export function hash(text) { return crypto.createHash("sha256").update(text).digest("hex"); }
