/* ============================================================
   data.js — curated content, plan logic data, fallbacks
   ============================================================ */
window.DATA = {

  /* Fasting protocols knowledge base */
  protocols: {
    "14:10": { fast:14, eat:10, name_ar:"14:10", name_en:"14:10",
      desc_ar:"بداية لطيفة: صيام 14 ساعة ونافذة أكل 10 ساعات. مثالي للمبتدئين.",
      desc_en:"A gentle start: fast 14h, eat within 10h. Ideal for beginners." },
    "16:8": { fast:16, eat:8, name_ar:"16:8", name_en:"16:8",
      desc_ar:"الأشهر عالمياً: صيام 16 ساعة ونافذة أكل 8 ساعات. توازن ممتاز بين النتائج والسهولة.",
      desc_en:"The world's most popular: fast 16h, eat within 8h. Great balance of results and ease." },
    "18:6": { fast:18, eat:6, name_ar:"18:6", name_en:"18:6",
      desc_ar:"للمتقدمين: صيام 18 ساعة ونافذة أكل 6 ساعات لحرق دهون أعمق.",
      desc_en:"For the experienced: fast 18h, eat within 6h for deeper fat-burning." },
    "20:4": { fast:20, eat:4, name_ar:"20:4", name_en:"20:4",
      desc_ar:"حمية المحارب: نافذة أكل 4 ساعات فقط. للمتقدمين جداً.",
      desc_en:"The Warrior Diet: a 4-hour eating window only. Very advanced." },
  },

  /* Quick tips (rotating on home) */
  tips: [
    { ar:"اشرب الماء بكثرة أثناء الصيام — يقلّل الجوع ويحافظ على طاقتك.", en:"Drink plenty of water while fasting — it curbs hunger and keeps energy up." },
    { ar:"القهوة والشاي بدون سكر مسموحان ولا يكسران الصيام.", en:"Black coffee and unsweetened tea are allowed and won't break your fast." },
    { ar:"ابدأ نافذة الأكل ببروتين وخضار قبل الكربوهيدرات.", en:"Open your eating window with protein and veg before carbs." },
    { ar:"النوم الكافي يقلّل هرمون الجوع ويسهّل الصيام.", en:"Enough sleep lowers hunger hormones and makes fasting easier." },
    { ar:"المشي الخفيف وقت الصيام يسرّع حرق الدهون.", en:"Light walking while fasting speeds up fat burning." },
    { ar:"اكسر صيامك بوجبة خفيفة (تمر وماء أو شوربة) قبل الوجبة الرئيسية.", en:"Break your fast gently (dates & water or soup) before a full meal." },
    { ar:"رشّة ملح في الماء تعوّض الأملاح وتقلّل الصداع وقت الصيام.", en:"A pinch of salt in water replaces electrolytes and eases fasting headaches." },
    { ar:"الجوع يأتي على شكل موجات — انتظر 10 دقائق وغالباً يزول.", en:"Hunger comes in waves — wait 10 minutes and it usually passes." },
    { ar:"تجنّب السكريات المكرّرة في نافذة الأكل لتثبيت طاقتك.", en:"Avoid refined sugar in your eating window to keep energy stable." },
    { ar:"البروتين الكافي يحافظ على عضلاتك أثناء فقدان الوزن.", en:"Enough protein protects your muscle while you lose weight." },
    { ar:"ابقِ نفسك مشغولاً وقت الصيام — الانشغال أقوى من الجوع.", en:"Stay busy while fasting — distraction beats hunger." },
    { ar:"كن ثابتاً على نفس نافذة الأكل يومياً ليعتاد جسمك.", en:"Keep the same eating window daily so your body adapts." },
  ],

  /* Reliable fallback meals (used if API is offline) — real TheMealDB images */
  fallbackMeals: [
    { id:"52772", title_ar:"دجاج تيرياكي", title:"Teriyaki Chicken", cat:"Chicken", area:"Japanese",
      img:"https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg", free:true },
    { id:"52777", title_ar:"سلطة التونة المتوسطية", title:"Mediterranean Tuna Salad", cat:"Seafood", area:"Italian",
      img:"https://www.themealdb.com/images/media/meals/yypwwq1511304979.jpg", free:true },
    { id:"52795", title_ar:"شوربة العدس", title:"Lentil Soup", cat:"Vegetarian", area:"Indian",
      img:"https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg", free:false },
    { id:"53025", title_ar:"فول مدمس", title:"Ful Medames", cat:"Vegetarian", area:"Egyptian",
      img:"https://www.themealdb.com/images/media/meals/lvn2d51598732465.jpg", free:false },
    { id:"52963", title_ar:"شكشوكة", title:"Shakshuka", cat:"Breakfast", area:"Egyptian",
      img:"https://www.themealdb.com/images/media/meals/g373701551450225.jpg", free:false },
    { id:"52772b", title_ar:"سلطة الأفوكادو", title:"Avocado Salad Bowl", cat:"Vegetarian", area:"Mexican",
      img:"https://www.themealdb.com/images/media/meals/b66myb1683207208.jpg", free:false },
  ],

  /* Curated ARABIC meals (shown to Arabic users instead of English TheMealDB).
     Each has Arabic name, category, ingredients & steps. id starts with "ar-". */
  mealsAr: [
    { id:"ar-1", title_ar:"شكشوكة", title:"Shakshuka", cat:"Breakfast", area:"مصري", free:true,
      img:"https://www.themealdb.com/images/media/meals/g373701551450225.jpg",
      ingredients:[{ing:"بيض",measure:"٣ حبات"},{ing:"طماطم مفرومة",measure:"٤ حبات"},{ing:"بصل",measure:"١ حبة"},{ing:"فلفل أخضر",measure:"١ حبة"},{ing:"كمون وملح وفلفل",measure:"حسب الذوق"},{ing:"زيت زيتون",measure:"٢ ملعقة"}],
      steps:"يُحمّر البصل والفلفل في زيت الزيتون، ثم تُضاف الطماطم والبهارات وتُترك حتى تتكاثف. اكسر البيض فوقها وغطِّ المقلاة حتى ينضج البيض. تُقدّم ساخنة." },
    { id:"ar-2", title_ar:"فول مدمس", title:"Ful Medames", cat:"Vegetarian", area:"مصري", free:true,
      img:"https://www.themealdb.com/images/media/meals/lvn2d51598732465.jpg",
      ingredients:[{ing:"فول مدمس",measure:"علبة"},{ing:"ليمون",measure:"١ حبة"},{ing:"ثوم مهروس",measure:"فصّان"},{ing:"كمون",measure:"رشّة"},{ing:"زيت زيتون",measure:"٢ ملعقة"}],
      steps:"سخّن الفول مع قليل من الماء، اهرسه قليلاً، أضف الثوم والكمون وعصير الليمون وزيت الزيتون. يُقدّم مع الخضار الطازجة." },
    { id:"ar-3", title_ar:"شوربة عدس", title:"Lentil Soup", cat:"Vegetarian", area:"شامي", free:false,
      img:"https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg",
      ingredients:[{ing:"عدس أصفر",measure:"كوب"},{ing:"بصل",measure:"١ حبة"},{ing:"جزر",measure:"١ حبة"},{ing:"كمون",measure:"ملعقة"},{ing:"مرق خضار",measure:"٤ أكواب"}],
      steps:"يُسلق العدس مع البصل والجزر والمرق حتى ينضج، يُضرب بالخلاط حتى يصبح ناعماً، يُتبّل بالكمون والملح ويُقدّم مع الليمون." },
    { id:"ar-4", title_ar:"تبولة", title:"Tabbouleh", cat:"Vegetarian", area:"لبناني", free:false,
      img:"https://www.themealdb.com/images/media/meals/b66myb1683207208.jpg",
      ingredients:[{ing:"بقدونس مفروم",measure:"باقة"},{ing:"برغل ناعم",measure:"٤ ملاعق"},{ing:"طماطم",measure:"٢ حبة"},{ing:"ليمون",measure:"١ حبة"},{ing:"زيت زيتون",measure:"٣ ملاعق"}],
      steps:"ينقع البرغل قليلاً، يُخلط مع البقدونس والطماطم المفرومة، يُتبّل بعصير الليمون وزيت الزيتون والملح. تُقدّم باردة." },
    { id:"ar-5", title_ar:"دجاج مشوي بالأعشاب", title:"Herb Grilled Chicken", cat:"Chicken", area:"متوسطي", free:false,
      img:"https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      ingredients:[{ing:"صدور دجاج",measure:"٢ قطعة"},{ing:"ثوم",measure:"٣ فصوص"},{ing:"زعتر وروزماري",measure:"ملعقة"},{ing:"ليمون",measure:"١ حبة"},{ing:"زيت زيتون",measure:"٢ ملعقة"}],
      steps:"يُتبّل الدجاج بالثوم والأعشاب والليمون وزيت الزيتون لمدة ساعة، ثم يُشوى على نار متوسطة حتى ينضج. يُقدّم مع سلطة خضراء." },
    { id:"ar-6", title_ar:"سمك مشوي بالليمون", title:"Lemon Grilled Fish", cat:"Seafood", area:"بحري", free:false,
      img:"https://www.themealdb.com/images/media/meals/yypwwq1511304979.jpg",
      ingredients:[{ing:"فيليه سمك",measure:"٢ قطعة"},{ing:"ليمون",measure:"١ حبة"},{ing:"كزبرة",measure:"ملعقة"},{ing:"ثوم",measure:"فصّان"},{ing:"زيت زيتون",measure:"٢ ملعقة"}],
      steps:"يُتبّل السمك بالثوم والكزبرة والليمون وزيت الزيتون، ثم يُشوى ٥ دقائق لكل جانب. يُقدّم مع أرز أو خضار مشوية." },
    { id:"ar-7", title_ar:"كفتة باللحم", title:"Beef Kofta", cat:"Beef", area:"عربي", free:false,
      img:"https://www.themealdb.com/images/media/meals/uttupv1511815050.jpg",
      ingredients:[{ing:"لحم مفروم",measure:"٥٠٠ غ"},{ing:"بصل مفروم",measure:"١ حبة"},{ing:"بقدونس",measure:"باقة صغيرة"},{ing:"بهارات مشكّلة",measure:"ملعقة"}],
      steps:"يُخلط اللحم مع البصل والبقدونس والبهارات جيداً، يُشكّل أصابع، ثم يُشوى على الفحم أو الشواية حتى ينضج. يُقدّم مع الخضار." },
    { id:"ar-8", title_ar:"سلطة فواكه", title:"Fruit Salad", cat:"Dessert", area:"خفيف", free:false,
      img:"https://images.unsplash.com/photo-1490474418924-9e6fc4bb1c5e?w=600&q=70",
      ingredients:[{ing:"تفاح",measure:"١ حبة"},{ing:"موز",measure:"١ حبة"},{ing:"فراولة",measure:"كوب"},{ing:"عسل",measure:"ملعقة"}],
      steps:"تُقطّع الفواكه إلى مكعبات، تُخلط معاً، يُضاف ملعقة عسل ورشّة قرفة اختيارية. حلوى صحية لكسر الصيام." },
  ],

  /* Article topics pulled from Wikipedia (free, no key) */
  /* Articles are free "simple info" for everyone — the gated value is the
     meal & workout PLANS (Pro), not general knowledge. */
  articleTopics: [
    { ar:"الصيام المتقطع", en:"Intermittent fasting", free:true,
      img:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=70" },
    { ar:"الالتهام الذاتي", en:"Autophagy", free:true,
      img:"https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400&q=70" },
    { ar:"حمية الكيتو", en:"Ketogenic diet", free:true,
      img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=70" },
    { ar:"مؤشر كتلة الجسم", en:"Body mass index", free:true,
      img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70" },
    { ar:"التمثيل الغذائي", en:"Metabolism", free:true,
      img:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=70" },
    { ar:"بروتين", en:"Protein (nutrient)", free:true,
      img:"https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=70" },
  ],

  /* Workout filter -> wger muscle/category mapping */
  workoutCats: [
    { key:"all", label_ar:"الكل", label_en:"All", cat:null },
    { key:"abs", label_ar:"بطن", label_en:"Abs", cat:10 },
    { key:"chest", label_ar:"صدر", label_en:"Chest", cat:11 },
    { key:"back", label_ar:"ظهر", label_en:"Back", cat:12 },
    { key:"legs", label_ar:"أرجل", label_en:"Legs", cat:9 },
    { key:"arms", label_ar:"ذراع", label_en:"Arms", cat:8 },
  ],

  /* Fallback workouts if wger offline */
  fallbackWorkouts: [
    { id:"w1", title_ar:"تمرين البلانك", title:"Plank Hold", muscle_ar:"عضلات البطن", muscle:"Core", free:true,
      desc:"Hold a straight-body plank position to build core stability.", desc_ar:"اثبت بوضعية البلانك بجسم مستقيم لتقوية عضلات الجذع.",
      img:"https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&q=70" },
    { id:"w2", title_ar:"تمرين القرفصاء", title:"Bodyweight Squat", muscle_ar:"الأرجل", muscle:"Legs", free:true,
      desc:"Lower into a squat keeping your chest up and knees aligned.", desc_ar:"انزل بوضعية القرفصاء مع إبقاء صدرك مرفوعاً والركبتين في خط مستقيم.",
      img:"https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=70" },
    { id:"w3", title_ar:"تمرين الضغط", title:"Push-up", muscle_ar:"الصدر", muscle:"Chest", free:false,
      desc:"Lower and push your body up keeping a straight line.", desc_ar:"اخفض جسمك وادفعه للأعلى مع الحفاظ على استقامة الجسم.",
      img:"https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&q=70" },
    { id:"w4", title_ar:"تمرين الطعن", title:"Lunges", muscle_ar:"الأرجل", muscle:"Legs", free:false,
      desc:"Step forward and lower your back knee toward the floor.", desc_ar:"اخطُ للأمام وأنزل ركبتك الخلفية نحو الأرض.",
      img:"https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400&q=70" },
  ],

  /* Default hero image for meals/workouts without image */
  placeholderImg: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=70",

  /* Arabic translations for common meal categories */
  catAr: { Breakfast:"فطور", Vegetarian:"نباتي", Seafood:"بحري", Chicken:"دجاج",
    Beef:"لحم", Dessert:"تحلية", Pasta:"مكرونة", Vegan:"نباتي صرف", Side:"أطباق جانبية", Starter:"مقبلات", Lamb:"ضأن", Goat:"ماعز", Miscellaneous:"متنوع" }
};
