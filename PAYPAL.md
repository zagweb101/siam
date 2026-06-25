# دمج الدفع عبر PayPal · PayPal integration

## ✅ خطواتك الآن (مختصرة)

1. **دوّر المفتاح السري:** ادخل [PayPal Developer](https://developer.paypal.com) → **Apps & Credentials** → تطبيقك → عند **Secret** اضغط **Revoke** ثم **Generate** سر جديد. (لأن السر القديم اللي كتبته في الشات أصبح مكشوفاً.)
2. **تأكد من البيئة:** أعلى الصفحة بدّل بين **Sandbox** (للتجربة) و **Live** (للفلوس الحقيقية). للتجربة استخدم مفاتيح **Sandbox**.
3. **حط السر يدوياً في ملف واحد فقط:** افتح `server/.env` والصق السر الجديد في السطر:
   ```
   PAYPAL_SECRET=السر_الجديد_هنا
   ```
   (الـ Client ID موجود بالفعل. لا تضع السر في أي ملف تاني.)
4. **نصّب وشغّل السيرفر:**
   ```bash
   cd siam/server
   npm install
   npm run setup-plans     # ينشئ خطتي الاشتراك (شهري/سنوي) ويطبع PLAN_MONTHLY_ID و PLAN_YEARLY_ID
   ```
   انسخ الـ IDs المطبوعة وضعها في `server/.env`.
5. **فعّل الدفع في الواجهة:** في `js/config.js` اضبط:
   ```js
   apiBase: "http://localhost:3000",
   paypalEnv: "sandbox",
   ```
6. **شغّل:** `npm start` ثم افتح `http://localhost:3000` — زر PayPal الحقيقي هيظهر في نافذة الاشتراك.
7. **(للإنتاج)** أنشئ **Webhook** في لوحة PayPal يشير إلى `https://نطاقك/api/webhook`، وضع الـ Webhook ID في `.env`، وبدّل `PAYPAL_ENV=live` بمفاتيح Live.

**الخلاصة لسؤالك:** نعم أنشئ **سر جديد** (Revoke ثم Generate)، وتضيفه **يدوياً مرة واحدة** في `server/.env` فقط — مش في كود الموقع.

---

## ⚠️ تحذير أمني مهم جداً — اقرأه أولاً

شاركتَ في المحادثة **Client ID** و **Secret key**. هذه القاعدة الذهبية:

- **Client ID** = عام (Public). آمن أن يظهر في كود الواجهة وفي المتصفح.
- **Secret key** = سري تماماً. **يجب ألّا يظهر إطلاقاً** في HTML/JS أو في المتصفح أو في أي مكان عام. مَن يملكه يستطيع إصدار عمليات دفع واسترداد باسم حسابك.

**الإجراء المطلوب الآن:**
1. ادخل على لوحة PayPal Developer → **Apps & Credentials**.
2. اختر تطبيقك → عند الـ Secret اضغط **Revoke** ثم أنشئ Secret جديد (Generate).
   لأن السر الذي كتبته أصبح يُعتبر مكشوفاً.
3. لا تكتب الـ Secret الجديد في أي ملف داخل هذا المشروع.

> English: The **Secret** you pasted must be considered compromised — **revoke it** in PayPal Developer → Apps & Credentials and generate a new one. Never place a Secret in front-end code; it lives only on a server.

---

## كيف يعمل الدفع فعلياً

```
[المتصفح / الواجهة]                      [سيرفرك الصغير]              [PayPal]
 يستخدم Client ID فقط  ───────────────►  يحمل Secret في متغير بيئة
 زر PayPal (SDK)                          ينشئ الطلب / يتحقق منه  ───► PayPal API
 onApprove → يرسل order id للسيرفر ─────► capture + تحقق         ───► تأكيد
```

- الواجهة: تحتاج **Client ID** فقط لعرض الأزرار.
- التحقق وإتمام الدفع (capture) لازم يتم على **سيرفر** يحمل الـ Secret بأمان.

---

## تفعيل أزرار PayPal في هذا المشروع (وضع تجريبي/Sandbox)

في آخر `js/app.js`:

```js
window.PAYPAL_CONFIG = { clientId: "ضع-Client-ID-هنا" };
```

- استخدم **Client ID الخاص بـ Sandbox** أثناء التجربة (وليس Live).
- بمجرد وضعه، يظهر زر PayPal تلقائياً داخل نافذة الاشتراك.
- النسخة الحالية تستخدم `actions.order.capture()` في المتصفح **للتجربة فقط**. للإنتاج، انقل الإنشاء والتحقق إلى سيرفر.

---

## مثال سيرفر صغير للإنتاج (Node/Express)

الـ Secret يُقرأ من متغير بيئة، لا من الكود:

```js
// server.js — شغّله على استضافتك، ليس في المتصفح
import express from "express";
const app = express();
app.use(express.json());

const CLIENT = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;          // ← من Environment variable فقط
const BASE   = "https://api-m.sandbox.paypal.com"; // Live: api-m.paypal.com

async function token(){
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method:"POST",
    headers:{ Authorization:"Basic "+Buffer.from(`${CLIENT}:${SECRET}`).toString("base64"),
              "Content-Type":"application/x-www-form-urlencoded" },
    body:"grant_type=client_credentials"
  });
  return (await r.json()).access_token;
}

app.post("/api/orders", async (req,res)=>{
  const t = await token();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${t}`, "Content-Type":"application/json" },
    body: JSON.stringify({ intent:"CAPTURE",
      purchase_units:[{ amount:{ currency_code:"USD", value:"4.99" } }] })
  });
  res.json(await r.json());
});

app.post("/api/orders/:id/capture", async (req,res)=>{
  const t = await token();
  const r = await fetch(`${BASE}/v2/checkout/orders/${req.params.id}/capture`, {
    method:"POST", headers:{ Authorization:`Bearer ${t}`, "Content-Type":"application/json" }
  });
  // هنا فعّل اشتراك المستخدم في قاعدة بياناتك بعد التأكد من الحالة COMPLETED
  res.json(await r.json());
});

app.listen(3000);
```

تشغيل بدون كتابة السر في الكود:

```bash
PAYPAL_CLIENT_ID=xxx PAYPAL_SECRET=yyy node server.js
```

ثم في الواجهة بدّل `createOrder`/`onApprove` لتنادي `/api/orders` و `/api/orders/:id/capture` بدل الـ capture المباشر.

---

## للاشتراكات الشهرية المتكررة (Subscriptions)
بدل الدفع لمرة واحدة، أنشئ **Product** ثم **Billing Plan** من لوحة PayPal أو الـ API، واستخدم
`paypal.Buttons({ createSubscription, onApprove })` مع `plan_id`. التفعيل والتجديد يُؤكَّدان عبر **Webhooks** على سيرفرك.
