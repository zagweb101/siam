/* ============================================================
   app.js — main controller, views, navigation, paywall, timer
   ============================================================ */
window.App = (() => {
  const t = (k)=>i18n.t(k);
  const L = ()=>i18n.lang;
  let currentTab = "home";
  let timerInt = null;
  const cache = { meals:{}, workouts:{}, articles:{} };

  /* ---------------- boot ---------------- */
  function init(){
    const st = Store.get();
    i18n.set(st.lang || "ar");
    bindGlobalEvents();
    if(Auth.isLoggedIn()){
      hydrateFromCloud().finally(()=>{
        if(Store.get().onboarded) enterApp(); else showScreen("splash");
      });
    } else {
      if(st.onboarded) enterApp(); else showScreen("splash");
    }
  }

  /* pull the user's profile + Pro status from the server (source of truth) */
  async function hydrateFromCloud(){
    if(!Auth.isLoggedIn()) return false;
    try{
      const j = await Auth.me();
      if(j.profile && j.profile.answers){
        Store.set({ answers:j.profile.answers, plan:j.profile.plan || null, onboarded:true, pro:!!j.pro });
      } else {
        Store.set({ pro:!!j.pro });
        await syncToCloud();           // new account → push local wizard data up
      }
      updateProBadge();
      return true;
    }catch(e){ if(e && e.status===401) Auth.logout(); return false; }
  }

  /* save current profile (answers + plan) to the cloud when logged in */
  async function syncToCloud(){
    if(!Auth.isLoggedIn()) return;
    const st = Store.get();
    try{ await Auth.saveProfile({ answers:st.answers, plan:st.plan }); }catch(e){}
  }

  function showScreen(name){
    document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("is-active", s.dataset.screen===name));
  }

  function enterApp(){
    if(!Store.get().plan) Store.generatePlan();
    showScreen("main");
    i18n.apply();
    updateProBadge();
    switchTab("home");
  }

  /* ---------------- events ---------------- */
  function bindGlobalEvents(){
    document.body.addEventListener("click", (e)=>{
      const actEl = e.target.closest("[data-action]");
      if(actEl){ handleAction(actEl.dataset.action, actEl, e); return; }
      const tab = e.target.closest("[data-tab]");
      if(tab){ switchTab(tab.dataset.tab); return; }
      const plan = e.target.closest("[data-plan]");
      if(plan){ selectPlan(plan); return; }
    });
  }

  function handleAction(action, el, e){
    switch(action){
      case "start-wizard": gateDisclaimer(()=>Wizard.start()); break;
      case "skip-to-app":
        gateDisclaimer(()=>{
          if(!Store.get().plan) Store.generatePlan();
          Store.set({ onboarded:true }); enterApp();
        }); break;
      case "accept-disclaimer":
        Store.set({ disclaimerAccepted:true }); closeModal();
        if(_pendingAfterDisclaimer){ const f=_pendingAfterDisclaimer; _pendingAfterDisclaimer=null; f(); }
        break;
      case "open-terms": openLegal("terms"); break;
      case "open-privacy": openLegal("privacy"); break;
      case "open-auth": gateAuth(()=>rerenderCurrent()); break;
      case "auth-toggle": authMode = authMode==="login" ? "register" : "login"; showAuth(); break;
      case "auth-submit": submitAuth(); break;
      case "logout": Auth.logout(); Store.set({ pro:false }); updateProBadge(); rerenderCurrent(); toast(t("auth.logout")); break;
      case "wizard-next": Wizard.next(); break;
      case "wizard-back": Wizard.back(); break;
      case "toggle-lang": {
        const lang = i18n.toggle(); Store.set({ lang });
        // re-render current view & wizard
        if(document.querySelector('.screen.wizard.is-active')) Wizard.render();
        else rerenderCurrent();
        break;
      }
      case "open-paywall": openPaywall(); break;
      case "close-paywall": closePaywall(); break;
      case "close-modal": closeModal(); break;
      case "subscribe": doSubscribe(); break;
      case "toggle-fast": toggleFast(); break;
      case "restart-wizard": Store.reset(); i18n.set("ar"); showScreen("splash"); break;
      case "manage-sub":
        if(Store.get().pro){ Store.set({pro:false}); updateProBadge(); rerenderCurrent(); toast(t("toast.unsub")); }
        else openPaywall();
        break;
    }
  }

  /* ---------------- tabs ---------------- */
  function switchTab(tab){
    currentTab = tab;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("is-active", b.dataset.tab===tab));
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("is-active", v.dataset.view===tab));
    document.getElementById("views").scrollTop = 0;
    renderTab(tab);
  }
  function rerenderCurrent(){ updateProBadge(); renderTab(currentTab); }

  function renderTab(tab){
    if(tab==="home") renderHome();
    else if(tab==="meals") renderMeals();
    else if(tab==="articles") renderArticles();
    else if(tab==="workouts") renderWorkouts();
    else if(tab==="profile") renderProfile();
  }

  /* ============================================================
     HOME
     ============================================================ */
  function renderHome(){
    const st = Store.get(), a = st.answers;
    const p = st.plan || Store.generatePlan();
    const name = a.name ? a.name : t("profile.guest");
    const v = document.querySelector('.view[data-view="home"]');
    const eatStr = fmtWindow(p.eatStart, p.eatEnd);

    v.innerHTML = `
      <div class="hello">
        <h2>${t("home.greeting")}, ${esc(name)} 👋</h2>
        <p>${t("home.sub")}</p>
      </div>

      <div class="plan-hero">
        <div class="ph-top">
          <div>
            <div class="ph-label">${t("home.yourplan")}</div>
            <div class="ph-proto">${p.proto}</div>
          </div>
          <div class="ph-ring">${p.calories}<br>${t("common.cal")}</div>
        </div>
        <div class="ph-window">
          <div class="ph-stat"><b>${p.fast}h</b><span>${t("home.fastwindow")}</span></div>
          <div class="ph-stat"><b>${eatStr}</b><span>${t("home.eatwindow")}</span></div>
          <div class="ph-stat"><b>${p.bmi}</b><span>${t("p.bmi")}</span></div>
        </div>
      </div>

      ${timerCard()}

      <div class="upsell" data-action="open-paywall">
        <span class="up-ico">👑</span>
        <div class="up-body">
          <div class="up-title">${t("upsell.title")}</div>
          <div class="up-sub">${t("upsell.sub")}</div>
        </div>
        <span class="up-arrow">${L()==="ar"?"‹":"›"}</span>
      </div>

      <div class="sec-head"><h3>${t("home.recmeals")}</h3><a data-tab-link="meals">${t("home.seeall")}</a></div>
      <div class="hscroll" id="homeMeals">${skelCards(3)}</div>

      <div class="sec-head"><h3>${t("home.recworkouts")}</h3><a data-tab-link="workouts">${t("home.seeall")}</a></div>
      <div class="hscroll" id="homeWorkouts">${skelCards(3)}</div>

      <div class="sec-head"><h3>${t("home.tips")}</h3></div>
      <div class="lcard" style="cursor:default">
        <div class="lc-body"><div class="lc-title" style="-webkit-line-clamp:none">💡 ${tipOfDay()}</div></div>
      </div>
    `;
    // see-all links
    v.querySelectorAll("[data-tab-link]").forEach(a=>a.addEventListener("click",()=>switchTab(a.dataset.tabLink)));
    startTimerLoop();

    // load meals + workouts
    API.meals(p.mealCat).then(list=>{
      cache.meals[p.mealCat]=list;
      const box=document.getElementById("homeMeals"); if(box) box.innerHTML = list.slice(0,6).map(mealCard).join("");
      bindCards(box,"meal");
    });
    API.workouts(null,L()).then(list=>{
      cache.workouts["all"]=list;
      const box=document.getElementById("homeWorkouts"); if(box) box.innerHTML = list.slice(0,6).map(workoutCard).join("");
      bindCards(box,"workout");
    });
  }

  function timerCard(){
    return `<div class="timer-card">
      <div class="sec-head" style="margin:0 0 6px"><h3>${t("home.timer.title")}</h3></div>
      <div class="timer-ring" id="timerRing"></div>
      <div class="timer-actions">
        <button class="btn ${Store.get().fast.active?'btn-outline':'btn-primary'}" data-action="toggle-fast" id="fastBtn">
          ${Store.get().fast.active? t("home.stop") : t("home.start")}
        </button>
      </div>
    </div>`;
  }

  function startTimerLoop(){
    if(timerInt) clearInterval(timerInt);
    drawTimer();
    timerInt = setInterval(drawTimer, 1000);
  }
  function drawTimer(){
    const ring = document.getElementById("timerRing");
    if(!ring){ if(timerInt) clearInterval(timerInt); return; }
    const st = Store.get(), p = st.plan;
    const totalFast = p.fast*3600;
    let elapsed=0, pct=0, label=t("home.fasting"), timeStr="00:00:00";
    if(st.fast.active && st.fast.startTs){
      elapsed = Math.floor((Date.now()-st.fast.startTs)/1000);
      pct = Math.min(1, elapsed/totalFast);
      timeStr = hms(elapsed);
    } else {
      label = t("home.eating"); timeStr = hms(0); pct=0;
    }
    const r=70, c=2*Math.PI*r, off=c*(1-pct);
    ring.innerHTML = `
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r="${r}" fill="none" stroke="#e6efe9" stroke-width="13"/>
        <circle cx="85" cy="85" r="${r}" fill="none" stroke="url(#g)" stroke-width="13" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#16b377"/><stop offset="1" stop-color="#0a7a52"/></linearGradient></defs>
      </svg>
      <div class="tr-center">
        <div class="tr-time">${timeStr}</div>
        <div class="tr-state">${label}${st.fast.active?` · ${Math.round(pct*100)}%`:""}</div>
      </div>`;
  }
  function toggleFast(){
    const st=Store.get();
    if(st.fast.active) Store.set({ fast:{active:false,startTs:null} });
    else Store.set({ fast:{active:true,startTs:Date.now()} });
    const btn=document.getElementById("fastBtn");
    if(btn){
      const on=Store.get().fast.active;
      btn.textContent = on? t("home.stop"):t("home.start");
      btn.className = "btn "+(on?"btn-outline":"btn-primary");
    }
    drawTimer();
  }

  /* ============================================================
     MEALS
     ============================================================ */
  function renderMeals(){
    const v = document.querySelector('.view[data-view="meals"]');
    const cats = [
      {k:"Vegetarian",l:t("meals.veg")},{k:"Breakfast",l:t("meals.breakfast")},
      {k:"Seafood",l:t("meals.seafood")},{k:"Chicken",l:t("meals.chicken")},
      {k:"Beef",l:"🥩"},{k:"Dessert",l:t("meals.dessert")}
    ];
    v.innerHTML = `
      <div class="hello"><h2>${t("meals.title")}</h2></div>
      <div class="searchbar">🔎<input id="mealSearch" placeholder="${t('meals.search')}"/></div>
      <div class="filters" id="mealFilters">
        ${cats.map((c,i)=>`<button class="fchip ${i===0?'is-active':''}" data-cat="${c.k}">${c.l}</button>`).join("")}
      </div>
      <div class="grid2" id="mealGrid">${skelCards(4)}</div>`;
    let active = "Vegetarian";
    loadMealGrid(active);
    v.querySelectorAll("#mealFilters .fchip").forEach(ch=>{
      ch.addEventListener("click",()=>{
        v.querySelectorAll(".fchip").forEach(x=>x.classList.remove("is-active"));
        ch.classList.add("is-active"); active=ch.dataset.cat; loadMealGrid(active);
      });
    });
    const se=v.querySelector("#mealSearch");
    se.addEventListener("input",()=>filterGrid("mealGrid", se.value));
  }
  function loadMealGrid(cat){
    const grid=document.getElementById("mealGrid"); if(!grid) return;
    grid.innerHTML=skelCards(4);
    API.meals(cat).then(list=>{
      cache.meals[cat]=list;
      grid.innerHTML = list.map(mealCard).join("");
      bindCards(grid,"meal");
    });
  }

  /* ============================================================
     ARTICLES
     ============================================================ */
  function renderArticles(){
    const v = document.querySelector('.view[data-view="articles"]');
    v.innerHTML = `
      <div class="hello"><h2>${t("articles.title")}</h2></div>
      <div class="searchbar">🔎<input id="artSearch" placeholder="${t('articles.search')}"/></div>
      <div id="artList">${skelLines(4)}</div>`;
    const list = DATA.articleTopics;
    const box = document.getElementById("artList");
    box.innerHTML = list.map((a,i)=>articleCard(a,i)).join("");
    box.querySelectorAll("[data-art]").forEach(el=>{
      el.addEventListener("click",()=>{
        const idx=+el.dataset.art, topic=list[idx];
        if(!topic.free && !Store.get().pro){ openLocked(); return; }
        openArticle(topic);
      });
    });
    const se=v.querySelector("#artSearch");
    se.addEventListener("input",()=>filterList("artList", se.value));
  }

  /* ============================================================
     WORKOUTS
     ============================================================ */
  function renderWorkouts(){
    const v = document.querySelector('.view[data-view="workouts"]');
    const cats = DATA.workoutCats;
    v.innerHTML = `
      <div class="hello"><h2>${t("workouts.title")}</h2></div>
      <div class="searchbar">🔎<input id="woSearch" placeholder="${t('workouts.search')}"/></div>
      <div class="filters" id="woFilters">
        ${cats.map((c,i)=>`<button class="fchip ${i===0?'is-active':''}" data-cat="${c.cat||''}">${L()==='ar'?c.label_ar:c.label_en}</button>`).join("")}
      </div>
      <div id="woList">${skelLines(4)}</div>`;
    loadWorkoutList(null);
    v.querySelectorAll("#woFilters .fchip").forEach(ch=>{
      ch.addEventListener("click",()=>{
        v.querySelectorAll(".fchip").forEach(x=>x.classList.remove("is-active"));
        ch.classList.add("is-active"); loadWorkoutList(ch.dataset.cat||null);
      });
    });
    const se=v.querySelector("#woSearch");
    se.addEventListener("input",()=>filterList("woList", se.value));
  }
  function loadWorkoutList(cat){
    const box=document.getElementById("woList"); if(!box) return;
    box.innerHTML=skelLines(4);
    API.workouts(cat,L()).then(list=>{
      box.innerHTML = list.map(workoutListItem).join("");
      box.querySelectorAll("[data-wo]").forEach((el,i)=>{
        el.addEventListener("click",()=>{
          const w=list[i];
          if(!w.free && !Store.get().pro){ openLocked(); return; }
          openWorkout(w);
        });
      });
    });
  }

  /* ============================================================
     PROFILE
     ============================================================ */
  function renderProfile(){
    const st=Store.get(), a=st.answers;
    const p = st.plan || Store.generatePlan();
    const v = document.querySelector('.view[data-view="profile"]');
    const name = a.name || t("profile.guest");
    const goalMap = { lose:t("w.goal.lose"),maintain:t("w.goal.maintain"),muscle:t("w.goal.muscle"),health:t("w.goal.health") };
    v.innerHTML = `
      <div class="profile-head">
        <div class="avatar">${a.gender==="female"?"👩":"🧑"}</div>
        <h2>${esc(name)}</h2>
        <div class="p-sub">${Auth.isLoggedIn()? esc((Auth.user()||{}).email||"") : t("auth.guest")}</div>
        ${st.pro?`<div class="p-sub" style="color:var(--green-700);font-weight:700;margin-top:2px">👑 ${t("p.pro")}</div>`:""}
      </div>
      <div class="stat-row">
        <div class="stat-box"><b>${p.proto}</b><span>${t("p.proto")}</span></div>
        <div class="stat-box"><b>${p.bmi}</b><span>${t("p.bmi")}</span></div>
        <div class="stat-box"><b>${p.calories}</b><span>${t("common.cal")}</span></div>
      </div>
      <div class="list-group">
        ${Auth.isLoggedIn()
          ? `<div class="list-item" data-action="logout"><span class="li-ico">🚪</span><span>${t("auth.logout")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>`
          : `<div class="list-item" data-action="open-auth"><span class="li-ico">👤</span><span>${t("auth.login")} / ${t("auth.register")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>`}
        <div class="list-item" data-action="restart-wizard"><span class="li-ico">🎯</span><span>${t("p.editplan")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>
        <div class="list-item" data-action="manage-sub"><span class="li-ico">👑</span><span>${t("p.subscription")}</span><span class="li-arrow">${st.pro?t("p.pro"):t("p.free")}</span></div>
        <div class="list-item" data-action="toggle-lang"><span class="li-ico">🌐</span><span>${t("p.lang")}</span><span class="li-arrow">${L()==='ar'?'العربية':'English'}</span></div>
      </div>
      <div class="list-group">
        <div class="list-item" data-action="open-terms"><span class="li-ico">📄</span><span>${t("p.terms")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>
        <div class="list-item" data-action="open-privacy"><span class="li-ico">🔒</span><span>${t("p.privacy")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>
        <div class="list-item" data-action="restart-wizard"><span class="li-ico">🔄</span><span>${t("p.restart")}</span><span class="li-arrow">${L()==='ar'?'‹':'›'}</span></div>
      </div>
      <p class="paywall-note" style="text-align:center;line-height:1.7">⚕️ ${t("disc.body")}<br>Siam · v1.0</p>`;
  }

  /* ============================================================
     DETAIL MODALS
     ============================================================ */
  function openMeal(id, card){
    const m = findMeal(id);
    if(m && !m.free && !Store.get().pro){ openLocked(); return; }
    openModalLoading();
    API.mealDetail(id).then(d=>{
      if(!d){ closeModal(); toast("⚠️ "+t("common.loading")); return; }
      const catAr = DATA.catAr[d.category]||d.category;
      const ings = d.ingredients.map(x=>`<li><span>${x.ing}</span><span>${x.measure}</span></li>`).join("");
      fillModal(`
        <div class="detail-hero" style="background-image:url('${d.img}')">
          <div class="dh-grad"></div>
          <button class="icon-btn close-x" data-action="close-modal">×</button>
          <div class="dh-title">${esc(d.title)}</div>
        </div>
        <div class="detail-body">
          <div class="tag-row"><span class="chip">${catAr}</span>${d.area?`<span class="chip">${d.area}</span>`:""}</div>
          <h4>${t("detail.ingredients")}</h4>
          <ul class="ing-list">${ings}</ul>
          <h4>${t("detail.steps")}</h4>
          <p>${esc(d.instructions).replace(/\r?\n/g,"<br>")}</p>
          ${d.source?`<a class="btn btn-outline btn-block" href="${d.source}" target="_blank" rel="noopener">${t("detail.readmore")}</a>`:""}
        </div>`);
    });
  }

  function openArticle(topic){
    openModalLoading();
    const title = L()==="ar"?topic.ar:topic.en;
    const wikiTitle = L()==="ar"?topic.ar:topic.en;
    API.article(wikiTitle, L()).then(d=>{
      if(!d){ closeModal(); toast("⚠️"); return; }
      const img = d.thumbnail || topic.img || DATA.placeholderImg;
      fillModal(`
        <div class="detail-hero" style="background-image:url('${img}')">
          <div class="dh-grad"></div>
          <button class="icon-btn close-x" data-action="close-modal">×</button>
          <div class="dh-title">${esc(d.title||title)}</div>
        </div>
        <div class="detail-body">
          <p>${esc(d.extract||"")}</p>
          ${d.url?`<a class="btn btn-outline btn-block" href="${d.url}" target="_blank" rel="noopener">${t("detail.readmore")} · Wikipedia</a>`:""}
        </div>`);
    });
  }

  function openWorkout(w){
    const img = w.img || DATA.placeholderImg;
    const desc = (L()==="ar"? (w.desc_ar||w.desc) : w.desc) || "";
    fillModal(`
      <div class="detail-hero" style="background-image:url('${img}')">
        <div class="dh-grad"></div>
        <button class="icon-btn close-x" data-action="close-modal">×</button>
        <div class="dh-title">${esc(L()==="ar"?(w.title_ar||w.title):w.title)}</div>
      </div>
      <div class="detail-body">
        <div class="tag-row"><span class="chip">💪 ${esc(w.muscle||"")}</span><span class="chip">3 × 12</span></div>
        <h4>${t("detail.steps")}</h4>
        <p>${esc(desc)||"—"}</p>
      </div>`);
    openModal();
  }

  /* ---- medical disclaimer gate (shown once) ---- */
  let _pendingAfterDisclaimer = null;
  function gateDisclaimer(then){
    if(Store.get().disclaimerAccepted){ then(); return; }
    _pendingAfterDisclaimer = then;
    showDisclaimer();
  }
  function showDisclaimer(){
    fillModal(`
      <div class="detail-body" style="padding:26px 22px 30px">
        <div style="text-align:center;font-size:46px">⚕️</div>
        <h4 style="text-align:center;font-size:20px">${t("disc.title")}</h4>
        <p style="text-align:center">${t("disc.body")}</p>
        <ul class="paywall-feats" style="margin:14px 0 18px">
          <li><span>!</span><span>${t("disc.p1")}</span></li>
          <li><span>!</span><span>${t("disc.p2")}</span></li>
          <li><span>!</span><span>${t("disc.p3")}</span></li>
        </ul>
        <button class="btn btn-primary btn-block" data-action="accept-disclaimer">${t("disc.agree")}</button>
        <p class="paywall-note" style="text-align:center;margin-top:12px">
          <a data-action="open-terms" style="color:var(--green-700);cursor:pointer">${t("p.terms")}</a> ·
          <a data-action="open-privacy" style="color:var(--green-700);cursor:pointer">${t("p.privacy")}</a>
        </p>
      </div>`);
    openModal();
  }
  function openLegal(which){
    const tk = which==="terms" ? "legal.terms" : "legal.privacy";
    fillModal(`
      <div class="detail-body" style="padding:26px 22px 30px">
        <button class="icon-btn close-x" data-action="close-modal" style="position:static;float:${L()==='ar'?'left':'right'}">×</button>
        <h4 style="font-size:19px">${t(tk+".title")}</h4>
        <p>${t(tk+".body")}</p>
      </div>`);
    openModal();
  }

  /* ---- account / auth ---- */
  let authMode = "login";
  let _pendingAfterAuth = null;
  function gateAuth(then){
    if(Auth.isLoggedIn()){ then && then(); return; }
    _pendingAfterAuth = then || null;
    authMode = "login";
    showAuth();
  }
  function showAuth(){
    const isLogin = authMode==="login";
    fillModal(`
      <div class="detail-body" style="padding:28px 22px 30px">
        <button class="icon-btn close-x" data-action="close-modal" style="position:static;float:${L()==='ar'?'left':'right'}">×</button>
        <div style="text-align:center;font-size:40px">🌿</div>
        <h4 style="text-align:center;font-size:20px">${isLogin?t("auth.login"):t("auth.register")}</h4>
        <p class="paywall-note" style="text-align:center;margin-bottom:6px">${_pendingAfterAuth?t("auth.subPrompt"):""}</p>
        <div id="authErr" class="paywall-note" style="color:var(--danger);text-align:center;min-height:14px"></div>
        <div class="field"><label>${t("auth.email")}</label><input id="authEmail" type="email" autocomplete="email" inputmode="email" /></div>
        <div class="field"><label>${t("auth.pass")}</label><input id="authPass" type="password" autocomplete="${isLogin?'current-password':'new-password'}" /></div>
        <button class="btn btn-primary btn-block" data-action="auth-submit" id="authBtn">${isLogin?t("auth.loginCta"):t("auth.registerCta")}</button>
        <p class="paywall-note" style="text-align:center;margin-top:14px">
          <a data-action="auth-toggle" style="color:var(--green-700);cursor:pointer;font-weight:700">${isLogin?t("auth.toRegister"):t("auth.toLogin")}</a>
        </p>
      </div>`);
    openModal();
    setTimeout(()=>{ const el=document.getElementById("authEmail"); if(el) el.focus(); }, 60);
  }
  async function submitAuth(){
    const email=(document.getElementById("authEmail")||{}).value||"";
    const pass=(document.getElementById("authPass")||{}).value||"";
    const errEl=document.getElementById("authErr");
    const btn=document.getElementById("authBtn");
    if(errEl) errEl.textContent="";
    if(btn){ btn.disabled=true; btn.textContent=t("common.loading"); }
    try{
      if(authMode==="login") await Auth.login(email,pass);
      else await Auth.register(email,pass);
      await hydrateFromCloud();
      closeModal();
      updateProBadge();
      toast(authMode==="login"?t("auth.welcome"):t("auth.created"));
      const cb=_pendingAfterAuth; _pendingAfterAuth=null; if(cb) cb();
    }catch(e){
      const key="auth.err."+((e&&e.message)||"generic");
      const msg=i18n.t(key);
      if(errEl) errEl.textContent = (msg===key ? t("auth.err.generic") : msg);
      if(btn){ btn.disabled=false; btn.textContent = authMode==="login"?t("auth.loginCta"):t("auth.registerCta"); }
    }
  }

  function openLocked(){
    fillModal(`
      <div class="detail-body" style="text-align:center;padding:40px 26px">
        <div style="font-size:54px">🔒</div>
        <h4 style="font-size:20px">${t("locked.title")}</h4>
        <p>${t("locked.body")}</p>
        <button class="btn btn-primary btn-block" data-action="close-modal" onclick="App.closeModal();App.openPaywall()">${t("locked.cta")} 👑</button>
      </div>`);
    openModal();
  }

  /* modal plumbing */
  function openModalLoading(){
    fillModal(`<div class="detail-body" style="text-align:center;padding:60px"><div class="skel" style="height:14px;width:60%;margin:0 auto;border-radius:8px"></div><p style="margin-top:16px">${t("common.loading")}</p></div>`);
    openModal();
  }
  function fillModal(html){ document.getElementById("modalSheet").innerHTML = html; }
  function openModal(){ const r=document.getElementById("modalRoot"); r.hidden=false; }
  function closeModal(){ document.getElementById("modalRoot").hidden=true; }

  /* ============================================================
     PAYWALL + SUBSCRIPTION
     ============================================================ */
  let selectedPlan = "yearly";
  function openPaywall(){
    // require an account first so the subscription is saved to the user (cross-device)
    if(!Auth.isLoggedIn()){ gateAuth(()=>openPaywall()); return; }
    document.getElementById("paywallRoot").hidden=false;
    document.querySelectorAll(".plan-card").forEach(c=>c.classList.toggle("is-sel", c.dataset.plan===selectedPlan));
    mountPayPal();
  }
  function closePaywall(){ document.getElementById("paywallRoot").hidden=true; }
  function selectPlan(el){
    selectedPlan = el.dataset.plan;
    document.querySelectorAll(".plan-card").forEach(c=>c.classList.remove("is-sel"));
    el.classList.add("is-sel");
  }
  function doSubscribe(source){
    Store.set({ pro:true });
    updateProBadge(); closePaywall(); rerenderCurrent();
    toast(t("toast.subscribed"));
  }
  function updateProBadge(){
    const b=document.getElementById("proBadge");
    if(b) b.hidden = !Store.get().pro;
  }

  const CFG = ()=> window.SIAM_CONFIG || {};
  function apiBase(){
    let b = (CFG().apiBase || "").replace(/\/$/,"");
    // when no apiBase is set but the app is served over http(s) (e.g. Railway),
    // talk to the SAME origin that served the page — so deploys need zero config.
    if(!b && typeof location !== "undefined" && location.protocol.indexOf("http") === 0) b = location.origin;
    return b;
  }

  /* PayPal Smart Buttons.
     · If a backend (SIAM_CONFIG.apiBase) is set  → real, server-verified flow
       (recurring subscription when plan ids exist, otherwise one-time order).
     · If only a Client ID is set                 → client-only sandbox demo.
     · Otherwise                                   → the demo "Subscribe" button. */
  function mountPayPal(){
    const cfg = CFG();
    if(!cfg.paypalClientId){ return; } // demo button only
    let holder = document.getElementById("paypalHolder");
    if(!holder){
      holder=document.createElement("div"); holder.id="paypalHolder"; holder.style.marginTop="12px";
      const cta=document.querySelector('[data-action="subscribe"]');
      cta.parentNode.insertBefore(holder, cta.nextSibling);
    }
    if(holder.dataset.rendered) return;

    loadPayPalSdk(()=>{
      if(!window.paypal){ console.warn("PayPal SDK not available"); return; }
      const base = apiBase();
      const planId = ()=> selectedPlan==="yearly" ? (cfg.planYearlyId) : (cfg.planMonthlyId);
      const useSubs = Boolean(planId());
      const btnCfg = { style:{ shape:"pill", color:"gold", layout:"vertical", height:44 } };

      const authH = ()=>Object.assign({"Content-Type":"application/json"}, Auth.authHeader());
      const uid = ()=> String((Auth.user()||{}).id || "");

      if(useSubs){
        // ---- recurring subscription (bound to the user via custom_id) ----
        btnCfg.createSubscription = (d,actions)=>actions.subscription.create({ plan_id: planId(), custom_id: uid() });
        btnCfg.onApprove = async (data)=>{
          if(base){
            try{
              const r=await fetch(base+"/api/subscriptions/verify",{method:"POST",headers:authH(),
                body:JSON.stringify({ subscriptionID:data.subscriptionID })});
              const j=await r.json(); if(j.pro) return doSubscribe("subscription");
              toast("⚠️ "+(j.status||"error"));
            }catch(e){ console.warn(e); }
          } else doSubscribe("subscription");
        };
      } else if(base){
        // ---- one-time order, created & captured on the server (bound to user) ----
        btnCfg.createOrder = async ()=>{
          const r=await fetch(base+"/api/orders",{method:"POST",headers:authH(),
            body:JSON.stringify({ plan:selectedPlan })});
          const j=await r.json(); return j.id;
        };
        btnCfg.onApprove = async (data)=>{
          const r=await fetch(base+`/api/orders/${data.orderID}/capture`,{method:"POST",headers:authH(),body:"{}"});
          const j=await r.json(); if(j.pro) doSubscribe("order"); else toast("⚠️ "+(j.status||"error"));
        };
      } else {
        // ---- client-only demo (no server): for sandbox testing only ----
        btnCfg.createOrder = (d,actions)=>actions.order.create({
          purchase_units:[{ amount:{ value: selectedPlan==="yearly"?(cfg.prices?.yearly||"35.88"):"4.99" }, description:"Siam Pro" }]
        });
        btnCfg.onApprove = (d,actions)=>actions.order.capture().then(()=>doSubscribe("demo"));
      }
      btnCfg.onError = (err)=>{ console.warn("paypal error:",err); toast("⚠️ PayPal"); };

      try{
        paypal.Buttons(btnCfg).render("#paypalHolder").then(()=>{
          // real PayPal is live → hide the demo "Subscribe" button so it can't grant free Pro
          const cta=document.querySelector('[data-action="subscribe"]');
          if(cta) cta.style.display="none";
          const note=document.querySelector('.paywall-note');
          if(note) note.textContent = t("paywall.secure");
        }).catch(e=>console.warn("paypal render:",e&&e.message));
        holder.dataset.rendered="1";
      }
      catch(e){ console.warn("paypal render:",e.message); }
    });
  }
  function loadPayPalSdk(cb){
    if(window.paypal) return cb();
    const cfg=CFG();
    const existing=document.getElementById("ppsdk");
    if(existing){ existing.addEventListener("load",cb); return; }
    const usesSubs = Boolean(cfg.planMonthlyId || cfg.planYearlyId);
    const s=document.createElement("script"); s.id="ppsdk";
    let url=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(cfg.paypalClientId)}&currency=${cfg.currency||"USD"}`;
    if(usesSubs) url+="&vault=true&intent=subscription";
    s.src=url; s.onload=cb; s.onerror=()=>console.warn("PayPal SDK failed to load");
    document.head.appendChild(s);
  }

  /* pull server config (client id / plan ids) if a backend is set */
  async function syncServerConfig(){
    const base=apiBase(); if(!base) return;
    try{
      const r=await fetch(base+"/api/config"); if(!r.ok) return;
      const j=await r.json();
      if(j.clientId) SIAM_CONFIG.paypalClientId=j.clientId;
      if(j.planMonthly) SIAM_CONFIG.planMonthlyId=j.planMonthly;
      if(j.planYearly) SIAM_CONFIG.planYearlyId=j.planYearly;
      if(j.prices) SIAM_CONFIG.prices=j.prices;
    }catch(e){ /* offline: keep local config */ }
  }

  /* ============================================================
     CARD / LIST RENDERERS
     ============================================================ */
  function mealCard(m){
    const locked = !m.free && !Store.get().pro;
    return `<div class="mcard" data-meal="${m.id}">
      <div class="mc-img" style="background-image:url('${m.img}')">${locked?'<span class="mc-lock">🔒</span>':''}</div>
      <div class="mc-body">
        <div class="mc-title">${esc(L()==='ar'?(m.title_ar||m.title):m.title)}</div>
        <div class="mc-meta"><span class="chip">${DATA.catAr[m.cat]||m.cat||''}</span></div>
      </div></div>`;
  }
  function workoutCard(w){
    const locked = !w.free && !Store.get().pro;
    return `<div class="mcard" data-workout='${JSON.stringify({id:w.id}).replace(/'/g,"&#39;")}' data-wid="${w.id}">
      <div class="mc-img" style="background-image:url('${w.img||DATA.placeholderImg}')">${locked?'<span class="mc-lock">🔒</span>':''}</div>
      <div class="mc-body"><div class="mc-title">${esc(L()==='ar'?(w.title_ar||w.title):w.title)}</div>
      <div class="mc-meta"><span class="chip">💪 ${esc(w.muscle||'')}</span></div></div></div>`;
  }
  function workoutListItem(w){
    const locked = !w.free && !Store.get().pro;
    return `<div class="lcard" data-wo="${w.id}">
      <div class="lc-img" style="background-image:url('${w.img||DATA.placeholderImg}')"></div>
      <div class="lc-body">
        <div class="lc-title">${esc(L()==='ar'?(w.title_ar||w.title):w.title)}</div>
        <div class="lc-sub">${esc((L()==='ar'?(w.desc_ar||w.desc):w.desc)||'')}</div>
      </div>${locked?'<span class="lc-lock">🔒</span>':''}</div>`;
  }
  function articleCard(a,i){
    const locked = !a.free && !Store.get().pro;
    const title = L()==='ar'?a.ar:a.en;
    return `<div class="lcard" data-art="${i}">
      <div class="lc-img" style="background-image:url('${a.img}')"></div>
      <div class="lc-body">
        <div class="lc-title">${esc(title)}</div>
        <div class="lc-sub">Wikipedia · ${L()==='ar'?'مقال':'article'}</div>
      </div>${locked?'<span class="lc-lock">🔒</span>':''}</div>`;
  }

  function bindCards(box, type){
    if(!box) return;
    if(type==="meal") box.querySelectorAll("[data-meal]").forEach(el=>el.addEventListener("click",()=>openMeal(el.dataset.meal,el)));
    if(type==="workout") box.querySelectorAll("[data-wid]").forEach(el=>{
      el.addEventListener("click",()=>{
        const w = (cache.workouts["all"]||[]).find(x=>String(x.id)===el.dataset.wid) || DATA.fallbackWorkouts[0];
        if(!w.free && !Store.get().pro){ openLocked(); return; }
        openWorkout(w);
      });
    });
  }

  /* ---------------- helpers ---------------- */
  function findMeal(id){
    for(const k in cache.meals){ const f=cache.meals[k].find(m=>String(m.id)===String(id)); if(f) return f; }
    return DATA.fallbackMeals.find(m=>String(m.id)===String(id)) || {free:false};
  }
  function filterGrid(boxId,q){
    q=(q||"").toLowerCase();
    document.querySelectorAll(`#${boxId} .mcard`).forEach(c=>{
      const t=(c.querySelector(".mc-title").textContent||"").toLowerCase();
      c.style.display = t.includes(q)?"":"none";
    });
  }
  function filterList(boxId,q){
    q=(q||"").toLowerCase();
    document.querySelectorAll(`#${boxId} .lcard`).forEach(c=>{
      const t=(c.querySelector(".lc-title").textContent||"").toLowerCase();
      c.style.display = t.includes(q)?"":"none";
    });
  }
  function skelCards(n){ return Array(n).fill('<div class="skel skel-card"></div>').join(""); }
  function skelLines(n){ return Array(n).fill('<div class="skel skel-line"></div>').join(""); }
  function fmtWindow(s,e){ const f=h=>String(((h%24)+24)%24).padStart(2,"0")+":00"; return f(s)+"–"+f(e); }
  function hms(sec){ const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60; return [h,m,s].map(x=>String(x).padStart(2,"0")).join(":"); }
  function tipOfDay(){ const tips=DATA.tips; const idx=new Date().getDate()%tips.length; return L()==="ar"?tips[idx].ar:tips[idx].en; }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function toast(msg){
    const el=document.getElementById("toast"); el.textContent=msg; el.hidden=false;
    clearTimeout(el._t); el._t=setTimeout(()=>el.hidden=true, 2600);
  }

  return { init, showScreen, enterApp, switchTab, toast, openPaywall, closeModal, openLocked, syncServerConfig, syncToCloud };
})();

document.addEventListener("DOMContentLoaded", ()=>{
  App.syncServerConfig && App.syncServerConfig();
  App.init();
  // PWA service worker — enabled only on a real (non-local) https host, so that
  // local development never serves stale cached code. Unregister any old SW on localhost.
  const isLocal = ["localhost","127.0.0.1","0.0.0.0",""].includes(location.hostname);
  if("serviceWorker" in navigator){
    if(isLocal){
      navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
      if(window.caches) caches.keys().then(ks=>ks.forEach(k=>caches.delete(k))).catch(()=>{});
    } else if(location.protocol === "https:"){
      navigator.serviceWorker.register("service-worker.js").catch(()=>{});
    }
  }
});
