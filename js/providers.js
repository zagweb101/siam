/* ============================================================
   providers.js — pluggable Pro CONTENT providers
   ------------------------------------------------------------
   Make Pro content (meals, workouts, …) come from ANY number of
   sources. Adding a new "Pro API" = add ONE entry to the registry
   below and list its id in `order`. Each provider exposes:
     • list(category, lang)  → [{ id:"<providerId>:<rawId>", title, title_ar, img, cat, area, free, provider }]
     • detail(rawId, lang)   → { title, img, area, category, instructions, ingredients:[{ing,measure}], source? }
   IDs are namespaced ("<providerId>:<rawId>") so detail() routes to
   the right provider automatically — no central switch to maintain.
   ============================================================ */
window.Providers = (() => {
  const MEALDB = "https://www.themealdb.com/api/json/v1/1";

  async function jget(url, ms = 9000){
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), ms);
    try { const r = await fetch(url, { signal: ctrl.signal }); if(!r.ok) throw new Error("HTTP "+r.status); return await r.json(); }
    finally { clearTimeout(tm); }
  }

  /* ---------------- MEAL PROVIDERS ---------------- */
  const meals = {
    // Original, owned content (no third-party licensing issue) — premium.
    "curated-ar": {
      name: "مطبخ صِيام (عربي)", premium: true, langs: ["ar"],
      async list(cat){
        const all = (window.DATA && DATA.mealsAr) || [];
        const f = (cat && cat !== "all") ? all.filter(m => m.cat === cat) : all;
        return (f.length ? f : all).map(m => ({
          id: "curated-ar:" + m.id, title: m.title, title_ar: m.title_ar,
          img: m.img, cat: m.cat, area: m.area, free: m.free, provider: "curated-ar",
        }));
      },
      async detail(rawId){
        const m = ((window.DATA && DATA.mealsAr) || []).find(x => x.id === rawId);
        return m ? { title: m.title_ar, img: m.img, area: m.area, category: m.cat, instructions: m.steps, ingredients: m.ingredients } : null;
      },
    },
    // Third-party (free public API). NOTE: TheMealDB free tier is for
    // testing/education — use their paid key for commercial use.
    "themealdb": {
      name: "TheMealDB", premium: false, langs: ["en", "ar"],
      async list(cat){
        const c = cat && cat !== "all" ? cat : "Vegetarian";
        const data = await jget(`${MEALDB}/filter.php?c=${encodeURIComponent(c)}`);
        return (data.meals || []).slice(0, 18).map((m, i) => ({
          id: "themealdb:" + m.idMeal, title: m.strMeal, title_ar: m.strMeal,
          img: m.strMealThumb, cat: c, area: m.strArea || "", free: i < 2, provider: "themealdb",
        }));
      },
      async detail(rawId){
        const data = await jget(`${MEALDB}/lookup.php?i=${rawId}`);
        const m = data.meals && data.meals[0]; if(!m) return null;
        const ingredients = [];
        for(let i=1;i<=20;i++){ const a=m["strIngredient"+i], b=m["strMeasure"+i]; if(a && a.trim()) ingredients.push({ ing:a.trim(), measure:(b||"").trim() }); }
        return { title: m.strMeal, img: m.strMealThumb, area: m.strArea, category: m.strCategory, instructions: m.strInstructions, ingredients, source: m.strSource };
      },
    },
    /* 👉 ADD A NEW PRO MEAL API HERE, e.g.:
    "my-original-cms": { name:"Siam Originals", premium:true, langs:["ar","en"],
      async list(cat,lang){ ... }, async detail(rawId,lang){ ... } },
    and add its id to `order.meals` below. */
  };

  /* Provider order per language (first = preferred; rest = fallback chain).
     Reorder / add ids to change which Pro API is used. */
  const order = {
    meals: { ar: ["curated-ar", "themealdb"], en: ["themealdb"] },
  };

  function chain(type, lang){
    const o = order[type] || {};
    return o[lang] || o.en || Object.keys((type === "meals" ? meals : {}));
  }

  return { meals, order, chain };
})();
