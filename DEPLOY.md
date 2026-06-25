# النشر على GitHub + Railway · Deploy guide

الموقع والسيرفر بيتنشروا مع بعض كحاجة واحدة (السيرفر بيقدّم الواجهة + الدفع). بعد النشر هيبقى عندك دومين HTTPS حقيقي — وده بيخلّي PayPal Live يشتغل صح.

---

## 0) قبل ما تبدأ — تأكيد الأمان
- ملف `server/.env` (اللي فيه الـ Secret) **مستثنى تلقائياً** عبر `.gitignore`، فمش هيترفع على GitHub. متشيلش الاستثناء ده.
- على Railway، الـ Secret هيتحط كـ **Environment Variable** في لوحة التحكم — **مش** في ملف.

تأكيد سريع إن `.env` مش هيترفع:
```bash
git status --porcelain | grep ".env"   # المفروض ما يطلعش server/.env
```

---

## 1) رفع على GitHub
```bash
cd "C:\Users\alhay\OneDrive\Desktop\siam"
git init
git add .
git commit -m "Siam app + PayPal backend"
git branch -M main
git remote add origin https://github.com/<اسمك>/siam.git
git push -u origin main
```
(اعمل ريبو جديد فاضي على github.com الأول وانسخ رابطه.)

---

## 2) النشر على Railway
1. ادخل [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → اختر ريبو `siam`.
2. Railway هيكتشف Node تلقائياً، ويشغّل `npm install` ثم `npm start` (موجودين في `package.json` بالجذر).
3. روح تبويب **Variables** وأضف المتغيرات دي:

   | المتغير | القيمة |
   |---|---|
   | `PAYPAL_ENV` | `live` |
   | `PAYPAL_CLIENT_ID` | الـ Client ID بتاعك |
   | `PAYPAL_SECRET` | الـ Secret بتاعك (السري) |
   | `PRICE_MONTHLY` | `4.99` |
   | `PRICE_YEARLY` | `35.88` |
   | `CURRENCY` | `USD` |
   | `JWT_SECRET` | نص عشوائي طويل (لتأمين تسجيل الدخول) |

   > `PORT` متحطّهوش — Railway بيوفّره تلقائياً والسيرفر بيستخدمه.
   > لتوليد `JWT_SECRET`: في PowerShell شغّل
   > `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` وانسخ الناتج.

4. **أضف قاعدة البيانات (PostgreSQL):**
   - داخل مشروع Railway اضغط **New** → **Database** → **Add PostgreSQL**.
   - Railway بيحقن متغير `DATABASE_URL` تلقائياً في السيرفر، والكود بينشئ الجداول لوحده عند أول تشغيل.
   - من غير قاعدة بيانات، السيرفر بيستخدم ملف JSON محلي (يضيع مع كل redeploy) — فلازم تضيف Postgres للإنتاج.

5. Railway هيديك دومين (الحالي: `https://siam-production-61f9.up.railway.app`). افتحه — المفروض التطبيق يشتغل، تسجيل الدخول والدفع والمزامنة كلها متوصّلة تلقائياً (نفس الدومين).

---

## 3) تفعيل الاشتراك المتجدد (مرة واحدة)
الخطط بتتعمل من حسابك. شغّلها محلياً (الـ `.env` بتاعك live بالفعل):
```bash
cd server
npm install
npm run setup-plans
```
هيطبع `PLAN_MONTHLY_ID` و `PLAN_YEARLY_ID`. ضيفهم في **Railway → Variables**:

| المتغير | القيمة |
|---|---|
| `PLAN_MONTHLY_ID` | `P-xxxx...` |
| `PLAN_YEARLY_ID` | `P-yyyy...` |

من غير الخطوة دي، الدفع هيشتغل كـ **دفعة واحدة** بدل اشتراك متجدد.

---

## 4) الـ Webhook (للتجديدات والإلغاءات)
1. في [PayPal Developer](https://developer.paypal.com) → تطبيقك (Live) → **Add Webhook**.
2. الـ URL: `https://<دومين-Railway>/api/webhook`
3. اختر الأحداث: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`, `PAYMENT.SALE.COMPLETED`.
4. انسخ الـ **Webhook ID** وحطّه في Railway كـ `PAYPAL_WEBHOOK_ID`.

---

## 5) لو زر PayPal مش ظاهر بعد النشر
في إعدادات تطبيق PayPal (Live) تأكد إن الدومين بتاع Railway مسموح/مضاف، وإن الحساب **Business** ومفعّل لاستقبال المدفوعات.

---

## ملاحظات
- مش محتاج تعدّل `js/config.js` — `apiBase` فاضي معناه "اتكلم مع نفس السيرفر"، فيشتغل على أي دومين.
- أي تعديل تعمله: `git add . && git commit -m "..." && git push` → Railway بيعيد النشر تلقائياً.
- `node_modules` و `.env` مستثنيين من Git — Railway بيعمل `npm install` لوحده.
