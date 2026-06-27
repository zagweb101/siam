/* ============================================================
   mailer.js — transactional email (graceful: no-op until SMTP set)
   Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM
   in the environment to enable sending.
   ============================================================ */
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT = "587", SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
export const mailEnabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let tx = null;
if (mailEnabled) {
  tx = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn("⚠️  Email disabled — set SMTP_HOST/SMTP_USER/SMTP_PASS to enable password-reset & receipts.");
}

export async function sendMail(to, subject, html) {
  if (!tx) return false;
  try { await tx.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html }); return true; }
  catch (e) { console.warn("mail send failed:", e.message); return false; }
}

/* simple branded wrapper */
export function wrap(title, body) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e6efe9;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#16b377,#0a7a52);color:#fff;padding:20px 24px;font-size:20px;font-weight:600">🌿 صِيام · Siam</div>
    <div style="padding:24px;color:#0e1f1a;line-height:1.7">${body}</div>
    <div style="padding:14px 24px;color:#52615b;font-size:12px;border-top:1px solid #e6efe9">${title}</div>
  </div>`;
}
