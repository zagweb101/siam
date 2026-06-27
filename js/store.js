/* ============================================================
   store.js — app state, persistence, plan generation
   ============================================================ */
window.Store = (() => {
  const KEY = "siam_state_v1";

  const defaults = {
    onboarded:false,
    pro:false,
    disclaimerAccepted:false,
    lang:"ar",
    answers:{ name:"", gender:"male", age:30, weight:75, height:172, goal:"lose", exp:"new", diet:"all" },
    plan:null,
    fast:{ active:false, startTs:null },
    stats:{ completed:0, streak:0, best:0, lastDay:null },
    sub:null,
    notify:false,
    ramadan:{ on:false, iftar:"18:00", suhoor:"04:00" },
    weights:[]
  };

  let state = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw) return Object.assign({}, defaults, JSON.parse(raw));
    }catch(e){}
    return JSON.parse(JSON.stringify(defaults));
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  function get(){ return state; }
  function set(patch){ Object.assign(state, patch); save(); }
  function setAnswer(k,v){ state.answers[k]=v; save(); }
  function reset(){ state = JSON.parse(JSON.stringify(defaults)); save(); }

  /* ---------- Plan generation ----------
     Mifflin-St Jeor BMR + activity + goal → calories + fasting protocol */
  function generatePlan(){
    const a = state.answers;
    const w = +a.weight, h = +a.height, age = +a.age;
    // BMR
    let bmr = 10*w + 6.25*h - 5*age + (a.gender === "male" ? 5 : -161);
    // light activity multiplier as baseline
    let tdee = bmr * 1.375;
    // goal adjustment
    let cal = tdee;
    if(a.goal === "lose") cal = tdee - 500;
    else if(a.goal === "muscle") cal = tdee + 250;
    cal = Math.round(cal/10)*10;

    // protocol by experience + goal:
    // beginners ease in (14:10); experienced fat-loss goes deeper (18:6).
    let proto;
    if(a.exp === "new") proto = "14:10";
    else if(a.exp === "some") proto = "16:8";
    else proto = a.goal === "lose" ? "18:6" : "16:8";

    // BMI
    const bmi = +(w / Math.pow(h/100,2)).toFixed(1);
    let bmiCat = "normal";
    if(bmi < 18.5) bmiCat = "under";
    else if(bmi < 25) bmiCat = "normal";
    else if(bmi < 30) bmiCat = "over";
    else bmiCat = "obese";

    const p = DATA.protocols[proto];
    // suggested eating window e.g. 12:00 - 20:00
    const eatStart = proto === "14:10" ? 10 : proto === "16:8" ? 12 : proto === "18:6" ? 13 : 16;
    const eatEnd = eatStart + p.eat;

    const plan = {
      proto, fast:p.fast, eat:p.eat,
      calories:cal, bmr:Math.round(bmr), bmi, bmiCat,
      eatStart, eatEnd,
      desc_ar:p.desc_ar, desc_en:p.desc_en,
      mealCat: dietToMealCat(a.diet),
      createdAt: Date.now()
    };
    set({ plan });
    return plan;
  }

  /* ---------- fasting streak / completion tracking ----------
     Counts a fast as "completed" once the user has fasted at least half of
     their target window. Distinct calendar days build the streak. */
  function recordFast(elapsedSec){
    const goal = ((state.plan && state.plan.fast) || 16) * 3600;
    if(!elapsedSec || elapsedSec < goal * 0.5) return null;
    const s = state.stats || (state.stats = { completed:0, streak:0, best:0, lastDay:null });
    const dayKey = (d)=>{ const x=new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10); };
    const today = dayKey(Date.now());
    if(s.lastDay !== today){
      const yesterday = dayKey(Date.now() - 86400000);
      s.streak = (s.lastDay === yesterday) ? (s.streak || 0) + 1 : 1;
      s.lastDay = today;
    }
    s.completed = (s.completed || 0) + 1;
    if(s.streak > (s.best || 0)) s.best = s.streak;
    save();
    return s;
  }

  /* ---------- weight log (one entry per day) ---------- */
  function logWeight(kg){
    kg=+kg; if(!kg||isNaN(kg)||kg<25||kg>400) return null;
    kg=Math.round(kg*10)/10;
    const x=new Date(); x.setHours(0,0,0,0); const day=x.toISOString().slice(0,10);
    const w=state.weights||(state.weights=[]);
    const e=w.find(p=>p.d===day);
    if(e) e.kg=kg; else w.push({ d:day, kg });
    w.sort((a,b)=> a.d<b.d?-1:1);
    save(); return w;
  }

  function dietToMealCat(diet){
    switch(diet){
      case "veg": return "Vegetarian";
      case "keto": return "Beef";
      case "lowcarb": return "Chicken";
      default: return "Seafood";
    }
  }

  return { get, set, setAnswer, reset, save, generatePlan, recordFast, logWeight };
})();
