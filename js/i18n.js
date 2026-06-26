/* ============================================================
   i18n.js — Arabic / English translations + helpers
   ============================================================ */
window.I18N = {
  ar: {
    "splash.tagline":"رفيقك الذكي للصيام المتقطع",
    "splash.cta":"ابدأ رحلتك",
    "splash.skip":"تصفّح بدون تسجيل",
    "app.title":"صِيام",

    "nav.home":"الرئيسية","nav.meals":"الوجبات","nav.articles":"مقالات",
    "nav.workouts":"تمارين","nav.profile":"حسابي",

    "wizard.next":"التالي","wizard.finish":"أنشئ خطتي","wizard.back":"رجوع",

    // wizard steps
    "w.name.q":"ما اسمك؟","w.name.help":"حتى نخصّص تجربتك لك","w.name.ph":"اكتب اسمك",
    "w.gender.q":"ما جنسك؟","w.gender.help":"يساعدنا في حساب احتياجك من السعرات",
    "w.male":"ذكر","w.female":"أنثى",
    "w.age.q":"كم عمرك؟","w.age.help":"اسحب لاختيار عمرك","w.years":"سنة",
    "w.body.q":"وزنك وطولك","w.body.help":"لحساب مؤشر كتلة الجسم والسعرات","w.weight":"الوزن (كجم)","w.height":"الطول (سم)",
    "w.goal.q":"ما هدفك الأساسي؟","w.goal.help":"اختر هدفاً واحداً للبدء",
    "w.goal.lose":"إنقاص الوزن","w.goal.lose.d":"حرق الدهون بثبات",
    "w.goal.maintain":"الحفاظ على الوزن","w.goal.maintain.d":"توازن وصحة أفضل",
    "w.goal.muscle":"بناء العضلات","w.goal.muscle.d":"قوة وكتلة عضلية",
    "w.goal.health":"صحة عامة","w.goal.health.d":"طاقة وتركيز أعلى",
    "w.exp.q":"خبرتك مع الصيام؟","w.exp.help":"سنضبط صعوبة الخطة على أساسها",
    "w.exp.new":"مبتدئ","w.exp.new.d":"أول مرة أجرب",
    "w.exp.some":"متوسط","w.exp.some.d":"جربت من قبل",
    "w.exp.pro":"متقدم","w.exp.pro.d":"أصوم بانتظام",
    "w.diet.q":"نمطك الغذائي؟","w.diet.help":"حتى نقترح وجبات تناسبك",
    "w.diet.all":"كل شيء","w.diet.veg":"نباتي","w.diet.keto":"كيتو","w.diet.lowcarb":"قليل الكارب",

    // home
    "home.greeting":"أهلاً","home.sub":"جاهز لصيام اليوم؟",
    "home.yourplan":"خطتك المقترحة","home.eatwindow":"نافذة الأكل","home.fastwindow":"مدة الصيام",
    "home.calories":"سعرات يومية","home.timer.title":"مؤقّت الصيام","home.fasting":"صائم الآن","home.eating":"نافذة الأكل",
    "home.start":"ابدأ الصيام","home.stop":"إنهاء","home.recmeals":"وجبات مقترحة لك",
    "home.recworkouts":"تمارين اليوم","home.tips":"نصائح سريعة","home.seeall":"عرض الكل",
    "home.streak":"سلسلة الأيام","home.completed":"صيامات مكتملة","home.best":"أطول سلسلة",
    "upsell.title":"افتح كل المزايا مع Pro","upsell.sub":"وجبات أسبوعية · تمارين مصوّرة · مقالات حصرية",

    // meals
    "meals.title":"الوجبات","meals.search":"ابحث عن وجبة...",
    "meals.all":"الكل","meals.breakfast":"فطور","meals.veg":"نباتي","meals.seafood":"بحري","meals.chicken":"دجاج","meals.dessert":"تحلية",
    // articles
    "articles.title":"مقالات وإرشادات","articles.search":"ابحث في المقالات...",
    // workouts
    "workouts.title":"التمارين","workouts.search":"ابحث عن تمرين...",
    "wo.all":"الكل","wo.abs":"بطن","wo.chest":"صدر","wo.legs":"أرجل","wo.back":"ظهر","wo.arms":"ذراع","wo.cardio":"كارديو",

    // profile
    "profile.guest":"ضيف","profile.member":"عضو Siam",
    "p.goal":"الهدف","p.proto":"البروتوكول","p.bmi":"كتلة الجسم",
    "p.editplan":"تعديل خطتي","p.subscription":"الاشتراك","p.notify":"التذكيرات","p.lang":"اللغة","p.about":"عن التطبيق","p.restart":"إعادة الـ Wizard",
    "p.free":"مجاني","p.pro":"Pro مُفعّل",
    "p.plan":"تفاصيل خطتك","p.fasthours":"ساعات الصيام","p.eatwindow":"نافذة الأكل","p.diet":"النمط الغذائي",
    "p.subStatus":"حالة الاشتراك","p.renews":"يتجدّد في","p.ends":"ينتهي في",
    "p.bmi.under":"نقص وزن","p.bmi.normal":"طبيعي","p.bmi.over":"زيادة وزن","p.bmi.obese":"سمنة",

    // paywall
    "paywall.title":"اشترك في Siam Pro","paywall.sub":"افتح كل الوجبات والتمارين والمقالات الحصرية",
    "paywall.f1":"خطط وجبات أسبوعية كاملة بالوصفات","paywall.f2":"مكتبة تمارين مصوّرة بالتفصيل",
    "paywall.f3":"مقالات وإرشادات حصرية من الخبراء","paywall.f4":"تتبّع نافذة الصيام والتذكيرات",
    "paywall.monthly":"شهري","paywall.yearly":"سنوي","paywall.permonth":"/شهر","paywall.save":"وفّر 40%",
    "paywall.cta":"اشترك الآن","paywall.demo":"الدفع آمن عبر PayPal. يمكنك إلغاء الاشتراك في أي وقت.",
    "paywall.secure":"🔒 دفع آمن عبر PayPal · يمكنك الإلغاء في أي وقت",
    "paywall.value":"الخطة السنوية بأقل من ٠.١٠$ في اليوم",
    "paywall.trust1":"دفع آمن 100%","paywall.trust2":"ألغِ في أي وقت","paywall.trust3":"بدون رسوم خفية",
    "paywall.usebtn":"من فضلك أكمل الدفع عبر زر PayPal بالأعلى",
    "sub.manageInfo":"لإلغاء أو إدارة اشتراكك، ادخل إعدادات حسابك في PayPal.",

    // misc
    "locked.title":"محتوى حصري","locked.body":"هذا المحتوى متاح لمشتركي Pro فقط.","locked.cta":"الترقية إلى Pro",
    "gate.meals.title":"خطة وجباتك متاحة في Pro","gate.meals.body":"اشترك في Siam Pro للحصول على خطة وجبات كاملة بالوصفات والصور مخصّصة لهدفك.",
    "gate.workouts.title":"خطة تمارينك متاحة في Pro","gate.workouts.body":"اشترك في Siam Pro للحصول على مكتبة تمارين مصوّرة بالتفصيل مخصّصة لمستواك.",
    "gate.cta":"الترقية إلى Pro 👑","gate.note":"تصفّح المعلومات والمقالات مجاناً — الخطط الغذائية والرياضية لمشتركي Pro.",
    "detail.ingredients":"المكوّنات","detail.steps":"طريقة التحضير","detail.muscles":"العضلات المستهدفة","detail.readmore":"المصدر الكامل",
    "toast.subscribed":"🎉 تم تفعيل Pro! استمتع بكل المزايا","toast.unsub":"تم إلغاء الاشتراك","toast.planready":"تم إنشاء خطتك بنجاح ✅","toast.fastlogged":"أحسنت! تم تسجيل صيامك ✅",
    "common.min":"دقيقة","common.cal":"سعرة","common.loading":"جارٍ التحميل...",

    // auth / account
    "auth.login":"تسجيل الدخول","auth.register":"إنشاء حساب","auth.email":"البريد الإلكتروني","auth.pass":"كلمة المرور",
    "auth.loginCta":"دخول","auth.registerCta":"إنشاء الحساب",
    "auth.toRegister":"ليس لديك حساب؟ أنشئ واحداً","auth.toLogin":"لديك حساب؟ سجّل الدخول",
    "auth.logout":"تسجيل الخروج","auth.account":"الحساب","auth.guest":"زائر — لم تسجّل الدخول",
    "auth.subPrompt":"سجّل الدخول أو أنشئ حساباً لإتمام الاشتراك وحفظه على كل أجهزتك.",
    "auth.mustPrompt":"أنشئ حسابك أو سجّل الدخول لحفظ خطتك والدخول إلى التطبيق.",
    "auth.synced":"بياناتك متزامنة على السحابة ☁️","auth.welcome":"أهلاً بعودتك 👋","auth.created":"تم إنشاء حسابك 🎉",
    "auth.err.invalid_email":"بريد إلكتروني غير صالح","auth.err.weak_password":"كلمة المرور 6 أحرف على الأقل",
    "auth.err.email_taken":"البريد مسجّل بالفعل","auth.err.bad_credentials":"بيانات الدخول غير صحيحة","auth.err.generic":"تعذّر الاتصال بالخادم",

    // medical disclaimer + legal
    "disc.title":"تنبيه صحي مهم","disc.body":"تطبيق صِيام أداة معلوماتية للعافية وليس بديلاً عن الاستشارة الطبية. استشر طبيباً مختصاً قبل بدء أي نظام صيام أو غذائي.",
    "disc.p1":"الصيام قد لا يناسب الحوامل والمرضعات.",
    "disc.p2":"مرضى السكري أو ضغط الدم أو من يتناولون أدوية يجب مراجعة الطبيب أولاً.",
    "disc.p3":"غير مخصص لمن لديهم تاريخ مع اضطرابات الأكل أو لمن هم دون 18 عاماً.",
    "disc.agree":"فهمت وأوافق على المتابعة","disc.minor":"⚠️ التطبيق مخصص لمن هم 18 عاماً فأكثر. يُرجى استشارة ولي الأمر والطبيب.",
    "p.terms":"الشروط والأحكام","p.privacy":"سياسة الخصوصية",
    "legal.terms.title":"الشروط والأحكام","legal.terms.body":"باستخدامك تطبيق صِيام فإنك توافق على أنه أداة معلوماتية للعافية فقط، وأنك المسؤول الوحيد عن قراراتك الصحية. الاشتراك الشهري/السنوي يُجدَّد تلقائياً ويمكن إلغاؤه في أي وقت من إعدادات حسابك في PayPal. لا نقدّم وعوداً بنتائج محددة.",
    "legal.privacy.title":"سياسة الخصوصية","legal.privacy.body":"كزائر، بياناتك تُحفظ محلياً على جهازك فقط. عند إنشاء حساب، يُحفظ ملفك (الاسم، العمر، الوزن، الطول، الهدف) وحالة اشتراكك بشكل آمن على خادمنا لمزامنتها عبر أجهزتك، وكلمة المرور مُشفّرة ولا نطّلع عليها. عمليات الدفع تتم بأمان عبر PayPal ولا نرى بيانات بطاقتك.",
  },

  en: {
    "splash.tagline":"Your smart intermittent-fasting companion",
    "splash.cta":"Start your journey",
    "splash.skip":"Browse without signing up",
    "app.title":"Siam",

    "nav.home":"Home","nav.meals":"Meals","nav.articles":"Articles",
    "nav.workouts":"Workouts","nav.profile":"Profile",

    "wizard.next":"Next","wizard.finish":"Create my plan","wizard.back":"Back",

    "w.name.q":"What's your name?","w.name.help":"So we can personalize your experience","w.name.ph":"Enter your name",
    "w.gender.q":"What's your gender?","w.gender.help":"Helps us estimate your calorie needs",
    "w.male":"Male","w.female":"Female",
    "w.age.q":"How old are you?","w.age.help":"Slide to pick your age","w.years":"yrs",
    "w.body.q":"Weight & height","w.body.help":"To compute your BMI and calories","w.weight":"Weight (kg)","w.height":"Height (cm)",
    "w.goal.q":"What's your main goal?","w.goal.help":"Pick one to get started",
    "w.goal.lose":"Lose weight","w.goal.lose.d":"Burn fat steadily",
    "w.goal.maintain":"Maintain weight","w.goal.maintain.d":"Balance & wellbeing",
    "w.goal.muscle":"Build muscle","w.goal.muscle.d":"Strength & mass",
    "w.goal.health":"General health","w.goal.health.d":"More energy & focus",
    "w.exp.q":"Your fasting experience?","w.exp.help":"We'll tune the plan difficulty",
    "w.exp.new":"Beginner","w.exp.new.d":"First time trying",
    "w.exp.some":"Intermediate","w.exp.some.d":"Tried it before",
    "w.exp.pro":"Advanced","w.exp.pro.d":"I fast regularly",
    "w.diet.q":"Your eating style?","w.diet.help":"So we suggest fitting meals",
    "w.diet.all":"Everything","w.diet.veg":"Vegetarian","w.diet.keto":"Keto","w.diet.lowcarb":"Low-carb",

    "home.greeting":"Hi","home.sub":"Ready for today's fast?",
    "home.yourplan":"Your recommended plan","home.eatwindow":"Eating window","home.fastwindow":"Fasting hours",
    "home.calories":"Daily calories","home.timer.title":"Fasting timer","home.fasting":"Fasting now","home.eating":"Eating window",
    "home.start":"Start fasting","home.stop":"End","home.recmeals":"Meals picked for you",
    "home.recworkouts":"Today's workouts","home.tips":"Quick tips","home.seeall":"See all",
    "home.streak":"Day streak","home.completed":"Fasts completed","home.best":"Best streak",
    "upsell.title":"Unlock everything with Pro","upsell.sub":"Weekly meals · illustrated workouts · exclusive articles",

    "meals.title":"Meals","meals.search":"Search a meal...",
    "meals.all":"All","meals.breakfast":"Breakfast","meals.veg":"Vegetarian","meals.seafood":"Seafood","meals.chicken":"Chicken","meals.dessert":"Dessert",
    "articles.title":"Articles & guides","articles.search":"Search articles...",
    "workouts.title":"Workouts","workouts.search":"Search an exercise...",
    "wo.all":"All","wo.abs":"Abs","wo.chest":"Chest","wo.legs":"Legs","wo.back":"Back","wo.arms":"Arms","wo.cardio":"Cardio",

    "profile.guest":"Guest","profile.member":"Siam member",
    "p.goal":"Goal","p.proto":"Protocol","p.bmi":"BMI",
    "p.editplan":"Edit my plan","p.subscription":"Subscription","p.notify":"Reminders","p.lang":"Language","p.about":"About","p.restart":"Restart wizard",
    "p.free":"Free","p.pro":"Pro active",
    "p.plan":"Your plan","p.fasthours":"Fasting hours","p.eatwindow":"Eating window","p.diet":"Diet",
    "p.subStatus":"Subscription","p.renews":"Renews on","p.ends":"Ends on",
    "p.bmi.under":"Underweight","p.bmi.normal":"Normal","p.bmi.over":"Overweight","p.bmi.obese":"Obese",

    "paywall.title":"Subscribe to Siam Pro","paywall.sub":"Unlock all meals, workouts & exclusive articles",
    "paywall.f1":"Full weekly meal plans with recipes","paywall.f2":"Detailed illustrated workout library",
    "paywall.f3":"Exclusive expert articles & guides","paywall.f4":"Fasting-window tracking & reminders",
    "paywall.monthly":"Monthly","paywall.yearly":"Yearly","paywall.permonth":"/mo","paywall.save":"Save 40%",
    "paywall.cta":"Subscribe now","paywall.demo":"Secure payment via PayPal. Cancel anytime.",
    "paywall.secure":"🔒 Secure payment via PayPal · cancel anytime",
    "paywall.value":"The yearly plan is less than $0.10 a day",
    "paywall.trust1":"100% secure payment","paywall.trust2":"Cancel anytime","paywall.trust3":"No hidden fees",
    "paywall.usebtn":"Please complete payment with the PayPal button above",
    "sub.manageInfo":"To cancel or manage your subscription, open your PayPal account settings.",

    "locked.title":"Exclusive content","locked.body":"This content is available to Pro members only.","locked.cta":"Upgrade to Pro",
    "gate.meals.title":"Your meal plan is in Pro","gate.meals.body":"Subscribe to Siam Pro for a full meal plan with recipes and photos, tailored to your goal.",
    "gate.workouts.title":"Your workout plan is in Pro","gate.workouts.body":"Subscribe to Siam Pro for a detailed illustrated workout library tailored to your level.",
    "gate.cta":"Upgrade to Pro 👑","gate.note":"Browse info and articles for free — meal & workout plans are for Pro members.",
    "detail.ingredients":"Ingredients","detail.steps":"Instructions","detail.muscles":"Target muscles","detail.readmore":"Full source",
    "toast.subscribed":"🎉 Pro activated! Enjoy all features","toast.unsub":"Subscription cancelled","toast.planready":"Your plan was created ✅","toast.fastlogged":"Well done! Fast logged ✅",
    "common.min":"min","common.cal":"cal","common.loading":"Loading...",

    "auth.login":"Log in","auth.register":"Create account","auth.email":"Email","auth.pass":"Password",
    "auth.loginCta":"Log in","auth.registerCta":"Create account",
    "auth.toRegister":"No account? Create one","auth.toLogin":"Have an account? Log in",
    "auth.logout":"Log out","auth.account":"Account","auth.guest":"Guest — not signed in",
    "auth.subPrompt":"Log in or create an account to complete and keep your subscription across all devices.",
    "auth.mustPrompt":"Create your account or log in to save your plan and enter the app.",
    "auth.synced":"Your data is synced to the cloud ☁️","auth.welcome":"Welcome back 👋","auth.created":"Account created 🎉",
    "auth.err.invalid_email":"Invalid email","auth.err.weak_password":"Password must be 6+ characters",
    "auth.err.email_taken":"Email already registered","auth.err.bad_credentials":"Wrong email or password","auth.err.generic":"Couldn't reach the server",

    "disc.title":"Important health notice","disc.body":"Siam is a wellness information tool, not a substitute for medical advice. Consult a qualified doctor before starting any fasting or diet program.",
    "disc.p1":"Fasting may not suit pregnant or breastfeeding women.",
    "disc.p2":"People with diabetes, blood-pressure issues, or on medication should check with a doctor first.",
    "disc.p3":"Not intended for anyone with a history of eating disorders, or under 18.",
    "disc.agree":"I understand & continue","disc.minor":"⚠️ This app is intended for ages 18+. Please consult a parent/guardian and a doctor.",
    "p.terms":"Terms & conditions","p.privacy":"Privacy policy",
    "legal.terms.title":"Terms & conditions","legal.terms.body":"By using Siam you agree it is a wellness information tool only and that you are solely responsible for your health decisions. Monthly/yearly subscriptions renew automatically and can be cancelled anytime from your PayPal account settings. We make no guarantee of specific results.",
    "legal.privacy.title":"Privacy policy","legal.privacy.body":"As a guest, your data stays on your device only. When you create an account, your profile (name, age, weight, height, goal) and subscription status are stored securely on our server to sync across your devices; your password is hashed and never visible to us. Payments are processed securely by PayPal; we never see your card details.",
  }
};

window.i18n = {
  lang: "ar",
  t(key){ return (window.I18N[this.lang] && window.I18N[this.lang][key]) || (window.I18N.ar[key]) || key; },
  set(lang){
    this.lang = lang;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    this.apply();
  },
  toggle(){ this.set(this.lang === "ar" ? "en" : "ar"); return this.lang; },
  apply(){
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
      el.placeholder = this.t(el.getAttribute("data-i18n-ph"));
    });
    document.querySelectorAll(".lang-toggle").forEach(b=> b.textContent = this.lang === "ar" ? "EN" : "ع");
  }
};
