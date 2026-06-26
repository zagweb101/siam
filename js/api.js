/* ============================================================
   api.js — free, key-less API wrappers with graceful fallback
   · TheMealDB  → meals + recipes + food photos
   · wger       → exercises
   · Wikipedia  → articles + summaries + thumbnails
   ============================================================ */
window.API = (() => {

  const MEALDB = "https://www.themealdb.com/api/json/v1/1";
  const WGER   = "https://wger.de/api/v2";

  // fetch with timeout so the UI never hangs
  async function jget(url, ms = 9000){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), ms);
    try{
      const r = await fetch(url, { signal: ctrl.signal });
      if(!r.ok) throw new Error("HTTP "+r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  /* ---------------- MEALS ---------------- */
  async function meals(category, lang){
    // Arabic users get fully-Arabic curated meals (names + recipes)
    if(lang === "ar"){
      const all = DATA.mealsAr || [];
      const filtered = (category && category !== "all") ? all.filter(m=>m.cat===category) : all;
      return (filtered.length ? filtered : all).map(m=>({
        id:m.id, title:m.title, title_ar:m.title_ar, img:m.img, cat:m.cat, area:m.area, free:m.free
      }));
    }
    try{
      const cat = category && category !== "all" ? category : "Vegetarian";
      const data = await jget(`${MEALDB}/filter.php?c=${encodeURIComponent(cat)}`);
      const list = (data.meals || []).slice(0, 18).map((m,i)=>({
        id: m.idMeal,
        title: m.strMeal,
        title_ar: m.strMeal,
        img: m.strMealThumb,
        cat: cat,
        area: m.strArea || "",
        free: i < 2                  // first 2 free, rest are Pro
      }));
      return list.length ? list : DATA.fallbackMeals;
    }catch(e){ console.warn("meals fallback:", e.message); return DATA.fallbackMeals; }
  }

  async function mealDetail(id){
    // curated Arabic meal → return its Arabic recipe directly (no network)
    if(String(id).startsWith("ar-")){
      const m = (DATA.mealsAr || []).find(x=>x.id===id);
      return m ? { id:m.id, title:m.title_ar, img:m.img, area:m.area, category:m.cat,
        instructions:m.steps, ingredients:m.ingredients, youtube:"", source:"" } : null;
    }
    try{
      const data = await jget(`${MEALDB}/lookup.php?i=${id}`);
      const m = data.meals && data.meals[0];
      if(!m) return null;
      const ingredients = [];
      for(let i=1;i<=20;i++){
        const ing = m["strIngredient"+i], mea = m["strMeasure"+i];
        if(ing && ing.trim()) ingredients.push({ ing: ing.trim(), measure:(mea||"").trim() });
      }
      return {
        id:m.idMeal, title:m.strMeal, img:m.strMealThumb,
        area:m.strArea, category:m.strCategory,
        instructions:m.strInstructions, ingredients,
        youtube:m.strYoutube, source:m.strSource
      };
    }catch(e){ console.warn("mealDetail:", e.message); return null; }
  }

  /* ---------------- ARTICLES (Wikipedia) ---------------- */
  // returns {title, extract, thumbnail, url}
  async function article(topic, lang){
    const wiki = lang === "ar" ? "ar" : "en";
    try{
      const t = encodeURIComponent(topic.replace(/ /g,"_"));
      const data = await jget(`https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${t}`);
      return {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail && data.thumbnail.source,
        url: data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page
      };
    }catch(e){ console.warn("article:", e.message); return null; }
  }

  /* ---------------- WORKOUTS (wger) ---------------- */
  async function workouts(category, lang){
    // wger API: always request English (language=2), then show localized labels from fallback data
    try{
      let url = `${WGER}/exercise/?language=2&limit=24&format=json`;
      if(category) url += `&category=${category}`;
      const data = await jget(url);
      const list = (data.results || [])
        .filter(x=> x.name && x.name.trim().length > 2)
        .slice(0,18)
        .map((x,i)=>({
          id:x.id,
          title:x.name,
          title_ar:x.name,
          muscle:(x.category && String(x.category)) || "",
          desc: stripHtml(x.description||""),
          desc_ar: stripHtml(x.description||""),
          img: DATA.fallbackWorkouts[i % DATA.fallbackWorkouts.length].img,
          free: i < 2
        }));
      return list.length ? list : DATA.fallbackWorkouts;
    }catch(e){ console.warn("workouts fallback:", e.message); return DATA.fallbackWorkouts; }
  }

  function stripHtml(s){ const d=document.createElement("div"); d.innerHTML=s; return (d.textContent||"").trim(); }

  return { meals, mealDetail, article, workouts };
})();
