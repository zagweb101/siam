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

  /* ---------------- MEALS (pluggable Pro providers) ---------------- */
  async function meals(category, lang){
    lang = lang === "ar" ? "ar" : "en";
    const chain = (window.Providers && Providers.chain("meals", lang)) || [];
    for(const pid of chain){
      const p = Providers.meals[pid]; if(!p) continue;
      try{ const list = await p.list(category, lang); if(list && list.length) return list; }
      catch(e){ console.warn("meal provider "+pid+" failed:", e.message); /* try next */ }
    }
    return DATA.fallbackMeals;   // last-resort offline content
  }

  async function mealDetail(id, lang){
    const s = String(id); const i = s.indexOf(":");
    let pid, rawId;
    if(i > 0){ pid = s.slice(0, i); rawId = s.slice(i+1); }
    else { rawId = s; pid = s.startsWith("ar-") ? "curated-ar" : "themealdb"; }  // legacy/fallback ids
    const p = window.Providers && Providers.meals[pid];
    if(!p) return null;
    try{ return await p.detail(rawId, lang); }
    catch(e){ console.warn("mealDetail "+pid+":", e.message); return null; }
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
