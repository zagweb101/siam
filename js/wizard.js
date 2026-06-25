/* ============================================================
   wizard.js — onboarding flow + plan generation handoff
   ============================================================ */
window.Wizard = (() => {
  const t = (k)=>i18n.t(k);
  let step = 0;
  const steps = ["name","gender","age","body","goal","exp","diet"];

  function start(){
    step = 0;
    App.showScreen("wizard");
    render();
  }

  function progress(){
    const pct = Math.round(((step+1)/steps.length)*100);
    document.getElementById("wizardProgress").style.width = pct+"%";
    document.getElementById("wizardStepCount").textContent = (step+1)+"/"+steps.length;
    const nextBtn = document.getElementById("wizardNext");
    nextBtn.textContent = step === steps.length-1 ? t("wizard.finish") : t("wizard.next");
  }

  function render(){
    const a = Store.get().answers;
    const body = document.getElementById("wizardBody");
    const s = steps[step];
    let html = "";

    if(s === "name"){
      html = stepWrap("👋", t("w.name.q"), t("w.name.help"),
        `<div class="field"><input id="wName" type="text" placeholder="${t('w.name.ph')}" value="${esc(a.name)}" /></div>`);
    }
    else if(s === "gender"){
      html = stepWrap("⚧", t("w.gender.q"), t("w.gender.help"),
        `<div class="opt-grid cols-2">
          ${optBox("gender","male","👨",t("w.male"),"",a.gender)}
          ${optBox("gender","female","👩",t("w.female"),"",a.gender)}
        </div>`);
    }
    else if(s === "age"){
      html = stepWrap("🎂", t("w.age.q"), t("w.age.help"),
        `<div class="slider-row">
          <input id="wAge" type="range" min="14" max="80" value="${a.age}" />
          <span class="slider-val"><b id="wAgeVal">${a.age}</b> <small>${t("w.years")}</small></span>
        </div>
        <p id="wAgeNote" class="paywall-note" style="color:#b8860b;margin-top:14px;${a.age<18?'':'display:none'}">${t("disc.minor")}</p>`);
    }
    else if(s === "body"){
      html = stepWrap("⚖️", t("w.body.q"), t("w.body.help"),
        `<div class="field"><label>${t("w.weight")}</label><input id="wWeight" type="number" inputmode="numeric" min="35" max="250" value="${a.weight}" /></div>
         <div class="field"><label>${t("w.height")}</label><input id="wHeight" type="number" inputmode="numeric" min="120" max="220" value="${a.height}" /></div>`);
    }
    else if(s === "goal"){
      html = stepWrap("🎯", t("w.goal.q"), t("w.goal.help"),
        `<div class="opt-grid">
          ${optBox("goal","lose","🔥",t("w.goal.lose"),t("w.goal.lose.d"),a.goal,true)}
          ${optBox("goal","maintain","⚖️",t("w.goal.maintain"),t("w.goal.maintain.d"),a.goal,true)}
          ${optBox("goal","muscle","💪",t("w.goal.muscle"),t("w.goal.muscle.d"),a.goal,true)}
          ${optBox("goal","health","✨",t("w.goal.health"),t("w.goal.health.d"),a.goal,true)}
        </div>`);
    }
    else if(s === "exp"){
      html = stepWrap("📈", t("w.exp.q"), t("w.exp.help"),
        `<div class="opt-grid">
          ${optBox("exp","new","🌱",t("w.exp.new"),t("w.exp.new.d"),a.exp,true)}
          ${optBox("exp","some","🚶",t("w.exp.some"),t("w.exp.some.d"),a.exp,true)}
          ${optBox("exp","pro","🏆",t("w.exp.pro"),t("w.exp.pro.d"),a.exp,true)}
        </div>`);
    }
    else if(s === "diet"){
      html = stepWrap("🥗", t("w.diet.q"), t("w.diet.help"),
        `<div class="opt-grid cols-2">
          ${optBox("diet","all","🍽️",t("w.diet.all"),"",a.diet)}
          ${optBox("diet","veg","🥦",t("w.diet.veg"),"",a.diet)}
          ${optBox("diet","keto","🥑",t("w.diet.keto"),"",a.diet)}
          ${optBox("diet","lowcarb","🍳",t("w.diet.lowcarb"),"",a.diet)}
        </div>`);
    }

    body.innerHTML = html;
    progress();
    bindStep(s);
  }

  function bindStep(s){
    // option selection
    document.querySelectorAll("#wizardBody .opt").forEach(el=>{
      el.addEventListener("click", ()=>{
        const key = el.dataset.key, val = el.dataset.val;
        Store.setAnswer(key, val);
        document.querySelectorAll(`#wizardBody .opt[data-key="${key}"]`).forEach(o=>o.classList.remove("is-sel"));
        el.classList.add("is-sel");
      });
    });
    if(s === "age"){
      const r = document.getElementById("wAge"), v = document.getElementById("wAgeVal"), n = document.getElementById("wAgeNote");
      r.addEventListener("input", ()=>{ v.textContent = r.value; if(n) n.style.display = (+r.value<18)?"":"none"; });
    }
  }

  function commitStep(){
    const s = steps[step];
    if(s === "name"){ const el=document.getElementById("wName"); Store.setAnswer("name", (el.value||"").trim()); }
    if(s === "age"){ Store.setAnswer("age", +document.getElementById("wAge").value); }
    if(s === "body"){
      Store.setAnswer("weight", clamp(+document.getElementById("wWeight").value,35,250,75));
      Store.setAnswer("height", clamp(+document.getElementById("wHeight").value,120,220,172));
    }
  }

  function next(){
    commitStep();
    if(step < steps.length-1){ step++; render(); }
    else finish();
  }
  function back(){
    if(step > 0){ step--; render(); }
    else App.showScreen("splash");
  }

  function finish(){
    Store.generatePlan();
    Store.set({ onboarded:true });
    App.enterApp();
    if(App.syncToCloud) App.syncToCloud();   // save plan to cloud if logged in
    App.toast(t("toast.planready"));
  }

  /* helpers */
  function stepWrap(emoji,q,help,inner){
    return `<div class="w-step"><div class="w-emoji">${emoji}</div>
      <div class="w-q">${q}</div><div class="w-help">${help}</div>${inner}</div>`;
  }
  function optBox(key,val,ico,label,sub,current,col){
    const sel = current === val ? "is-sel" : "";
    const colCls = col ? "col" : "";
    return `<button class="opt ${colCls} ${sel}" data-key="${key}" data-val="${val}">
      <span class="opt-ico">${ico}</span>
      <span><span>${label}</span>${sub?`<br><small>${sub}</small>`:""}</span>
    </button>`;
  }
  function esc(s){ return String(s||"").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }
  function clamp(n,min,max,def){ n=+n; if(!n||isNaN(n)) return def; return Math.min(max,Math.max(min,n)); }

  return { start, next, back, render };
})();
