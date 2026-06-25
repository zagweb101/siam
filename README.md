# صِيام · Siam — Intermittent Fasting App (commercial-ready)

تطبيق ويب بشكل تطبيق موبايل للصيام المتقطع: Wizard للتعريف بالمستخدم ثم خطة مخصصة، مع وجبات ومقالات وتمارين، واشتراك Pro مدفوع عبر PayPal.

A mobile-app-style PWA for intermittent fasting: onboarding wizard → personalized plan, plus meals, articles, workouts, and a paid Pro subscription via PayPal.

---

## المزايا · Features
- **Wizard** من 7 خطوات → يحسب BMR/السعرات/BMI ويختار بروتوكول الصيام (14:10 / 16:8 / 18:6).
- **عربي/إنجليزي** بزر تبديل، مع **RTL للعربية و LTR للإنجليزية** تلقائياً.
- **Mobile-first + responsive 100%** على كل الشاشات (هواتف صغيرة/كبيرة، تابلت، ديسكتوب، أفقي).
- **PWA**: قابل للتثبيت كتطبيق، يعمل **offline** (service worker + manifest + أيقونات).
- **APIs مجانية بدون مفتاح**: TheMealDB (وجبات+صور)، wger (تمارين)، Wikipedia (مقالات) — كلها مع بيانات احتياطية.
- **دفع حقيقي عبر PayPal**: backend آمن يحفظ الـ Secret على السيرفر فقط، مع اشتراكات متكررة + webhook.
- **جاهزية تجارية**: إخلاء مسؤولية طبي، شروط وأحكام، سياسة خصوصية، تنبيه لمن هم دون 18.

---

## التشغيل السريع (واجهة فقط) · Quick start (front-end only)
```bash
cd siam
python -m http.server 8000      # ثم افتح http://localhost:8000
```
بدون سيرفر، زر الدفع يعمل بوضع تجريبي (Sandbox/Demo) ويفعّل Pro بدون خصم.

## التشغيل التجاري الكامل (مع الدفع) · Full commercial run (with payments)
```bash
cd siam/server
cp .env.example .env             # ثم املأ القيم (انظر PAYPAL.md)
npm install
npm run setup-plans              # ينشئ خطط الاشتراك ويطبع الـ IDs
npm start                        # السيرفر يقدّم الموقع + الدفع على http://localhost:3000
```
ثم في `js/config.js` اضبط `apiBase: "http://localhost:3000"` لتفعيل الدفع المتحقَّق من السيرفر.

> ملاحظة: مجلد `server/node_modules` يُنشأ عند `npm install` — يمكنك حذفه بأمان وقت الرفع (مستثنى في `.gitignore`).

---

## البنية · Structure
```
siam/
├─ index.html              ← هيكل التطبيق (PWA)
├─ manifest.webmanifest    ← إعدادات الـ PWA
├─ service-worker.js       ← العمل بدون إنترنت (offline)
├─ icons/                  ← أيقونات التطبيق (svg + png 192/512 + maskable)
├─ css/styles.css          ← الثيم الأخضر + responsive + RTL/LTR
├─ js/
│  ├─ config.js            ← إعداد الواجهة (apiBase + Client ID العام)
│  ├─ i18n.js              ← الترجمة عربي/إنجليزي + RTL/LTR
│  ├─ data.js · api.js     ← المحتوى + ربط الـ APIs المجانية
│  ├─ store.js             ← الحالة + الحفظ + توليد الخطة (BMR)
│  ├─ wizard.js · app.js   ← التعريف + التحكم + الدفع + المؤقّت
├─ server/                 ← backend الدفع (الـ Secret هنا فقط، عبر .env)
│  ├─ server.js            ← Orders + Subscriptions + Webhook + يقدّم الموقع
│  ├─ setup-plans.js       ← إنشاء خطط الاشتراك في PayPal
│  └─ .env.example         ← انسخه إلى .env واملأه
├─ PAYPAL.md               ← خطوات تفعيل الدفع + الأمان (اقرأه)
└─ README.md
```

---

## الأمان · Security (مهم)
- الـ **Client ID** عام وآمن في كود الواجهة. الـ **Secret** سري ويعيش في `server/.env` فقط — **لا يصل للمتصفح إطلاقاً** (تم التحقق: `/api/config` لا يرجع الـ Secret).
- بيانات المستخدم (الاسم/العمر/الوزن...) تُحفظ **محلياً على الجهاز** فقط (localStorage)، لا تُرسل لأي خادم.
- راجع `PAYPAL.md` لخطوات إنشاء/تدوير المفاتيح وضبط الـ webhook.

## إخلاء مسؤولية · Disclaimer
صِيام أداة معلوماتية للعافية وليست بديلاً عن الاستشارة الطبية. مخصص لمن هم 18 عاماً فأكثر.
