'use strict';

const PROTEIN_BOOSTERS = [
  { name:'Greek yogurt',      amount:'1 cup (150g)', protein:17, note:'Add as a snack or breakfast topping' },
  { name:'Boiled eggs',       amount:'2 eggs',       protein:12, note:'Quick snack — eggs OK in your diet' },
  { name:'Paneer',            amount:'100g',         protein:18, note:'Add to any sabzi or eat with fruit' },
  { name:'Roasted chickpeas', amount:'½ cup',        protein:10, note:'Great crunchy snack with chaat masala' },
  { name:'Moong dal chilla',  amount:'2 chillas',    protein:14, note:'Quick 15 min — already in your recipe vault!' },
  { name:'Peanut butter',     amount:'2 tbsp',       protein:8,  note:'Easy mid-morning snack' },
  { name:'Edamame',           amount:'½ cup boiled', protein:11, note:'Toss with salt & lemon for a quick snack' }
];

function _nutTargets() {
  const p     = userProfile || {};
  const goals = p.nutrition_goals || ['balanced'];
  return {
    protein:  goals.includes('protein') ? 80  : 65,
    carbs:    goals.includes('light')   ? 150 : 200,
    fat:      goals.includes('heart')   ? 40  : 55,
    calories: goals.includes('light')   ? 1400 : goals.includes('energy') ? 2000 : 1600
  };
}

function getBalanceSuggestions(parsed) {
  const targets     = _nutTargets();
  const gap         = { protein: targets.protein - parsed.protein_g, calories: targets.calories - parsed.calories };
  const suggestions = [];
  if (gap.protein > 10) {
    const boosters = PROTEIN_BOOSTERS.filter(b=>b.protein<=gap.protein+10).sort((a,b)=>Math.abs(a.protein-gap.protein)-Math.abs(b.protein-gap.protein)).slice(0,3);
    suggestions.push({ type:'protein', gap:gap.protein, boosters });
  }
  if (parsed.calories < 1200) suggestions.push({ type:'calories', gap:Math.round(targets.calories-parsed.calories) });
  if (parsed.carbs_g  > 250)  suggestions.push({ type:'carbs' });
  return suggestions;
}

function estimateNutritionLocally(meals) {
  const NUT = { breakfast:{protein:13,carbs:55,fat:11,calories:375}, dinner:{protein:19,carbs:65,fat:14,calories:470} };
  const dayMap = {};
  meals.forEach(m => {
    if (!dayMap[m.day]) dayMap[m.day]={day:m.day,protein:0,carbs:0,fat:0,calories:0};
    const n=NUT[m.meal]||NUT.dinner;
    dayMap[m.day].protein+=n.protein; dayMap[m.day].carbs+=n.carbs;
    dayMap[m.day].fat+=n.fat;         dayMap[m.day].calories+=n.calories;
  });
  const days=Object.values(dayMap), c=days.length||1;
  return {
    protein_g:Math.round(days.reduce((s,d)=>s+d.protein,0)/c),
    carbs_g:  Math.round(days.reduce((s,d)=>s+d.carbs,0)/c),
    fat_g:    Math.round(days.reduce((s,d)=>s+d.fat,0)/c),
    calories: Math.round(days.reduce((s,d)=>s+d.calories,0)/c),
    balance_note:'Estimated values based on typical vegetarian meal composition.',
    days, isEstimate:true
  };
}

function renderNutrition(parsed) {
  const targets    = _nutTargets();
  const barColour  = (val,target) => val<target*.7?'var(--saffron)':val<target?'var(--turmeric)':'var(--leaf)';
  const pb=document.getElementById('bar-protein'); pb.style.width=Math.min(100,parsed.protein_g/100*100)+'%'; pb.style.background=barColour(parsed.protein_g,targets.protein);
  document.getElementById('bar-carbs').style.width=Math.min(100,parsed.carbs_g/300*100)+'%';
  document.getElementById('bar-fat').style.width  =Math.min(100,parsed.fat_g/80*100)+'%';
  document.getElementById('bar-cal').style.width  =Math.min(100,parsed.calories/2200*100)+'%';
  document.getElementById('val-protein').textContent=parsed.protein_g+'g';
  document.getElementById('val-carbs').textContent  =parsed.carbs_g+'g';
  document.getElementById('val-fat').textContent    =parsed.fat_g+'g';
  document.getElementById('val-cal').textContent    =parsed.calories;

  let breakdown='';
  if (parsed.isEstimate) breakdown+='<div class="ai-tip" style="background:#FEF8EE;border:1px solid #F0C96A">📊 <strong>Estimated</strong> — approximate values based on meal types.</div>';
  if (parsed.balance_note&&!parsed.isEstimate) breakdown+='<div class="ai-tip">🧠 '+parsed.balance_note+'</div>';

  const suggestions=getBalanceSuggestions(parsed);
  suggestions.forEach(s=>{
    if (s.type==='protein') {
      breakdown+='<div class="section-label" style="color:var(--saffron-dark)">⚡ Boost your protein (+'+s.gap+'g needed)</div>';
      breakdown+='<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Your meals give '+parsed.protein_g+'g — target is ~'+targets.protein+'g. Add any of these on the side:</div>';
      s.boosters.forEach(b=>{
        breakdown+='<div class="card-sm" style="padding:10px 12px;margin-bottom:7px;border-left:3px solid var(--leaf)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><div style="font-size:13px;font-weight:500">'+b.name+'</div><span class="chip-green" style="font-size:11px;font-weight:600">+'+b.protein+'g protein</span></div><div style="font-size:11px;color:var(--text-muted)">'+b.amount+' — '+b.note+'</div></div>';
      });
    }
    if (s.type==='calories') breakdown+='<div class="ai-tip" style="background:#FEF0E6;border:1px solid #F0C09A">🔥 Only '+parsed.calories+' kcal — add a hearty snack (+'+s.gap+' kcal needed). Try a moong dal chilla or peanut butter toast.</div>';
    if (s.type==='carbs')    breakdown+='<div class="ai-tip" style="background:#FEF0E6;border:1px solid #F0C09A">🌾 Carbs are high ('+parsed.carbs_g+'g). Try swapping rice for extra dal or a salad one day.</div>';
  });

  if (parsed.days&&parsed.days.length) {
    breakdown+='<div class="section-label">Day by day</div>';
    parsed.days.forEach(d=>{
      const lowP=d.protein<targets.protein*.6;
      breakdown+='<div class="card-sm" style="padding:9px 11px'+(lowP?';border-left:3px solid var(--saffron)':'')+'">' +
        '<div style="display:flex;justify-content:space-between"><div style="font-size:13px;font-weight:500">'+d.day+(lowP?' <span style="font-size:10px;color:var(--saffron-dark)">↑ add protein</span>':'')+
        '</div><div style="font-size:11px;color:var(--text-muted)">'+d.calories+' kcal</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:5px"><span class="chip-green" style="font-size:10px">P: '+d.protein+'g</span><span class="chip-yellow" style="font-size:10px">C: '+d.carbs+'g</span><span class="chip" style="font-size:10px">F: '+d.fat+'g</span></div>' +
      '</div>';
    });
  }
  document.getElementById('nut-breakdown').innerHTML=breakdown;
}

async function analyseNutrition() {
  const btn=document.getElementById('nut-btn');
  btn.innerHTML='<span class="spinner"></span> Analysing...'; btn.disabled=true;
  const meals=[];
  Object.entries(mealPlan).forEach(([dayIdx,day])=>{
    if(day.breakfast&&day.breakfast.source!=='outside')meals.push({day:DAYS[dayIdx],meal:'breakfast',name:day.breakfast.name});
    if(day.dinner&&day.dinner.source!=='outside')meals.push({day:DAYS[dayIdx],meal:'dinner',name:day.dinner.name});
  });
  if(!meals.length){ btn.textContent="🔍 Analyse this week's meals"; btn.disabled=false; document.getElementById('nut-breakdown').innerHTML='<div style="font-size:12px;color:var(--text-muted)">No meals planned yet.</div>'; return; }
  try {
    const prompt='Estimate nutrition for these meals (profile: '+buildProfileString(userProfile)+'): '+meals.map(m=>m.day+' '+m.meal+': '+m.name).join(', ')+'. Per-day averages. JSON only: {"protein_g":45,"carbs_g":180,"fat_g":35,"calories":1400,"balance_note":"...","days":[{"day":"Mon","protein":40,"carbs":170,"fat":30,"calories":1300}]}';
    renderNutrition(parseAIJson(await callAI(prompt,1200)));
    localStorage.setItem('rv_nut_'+getWeekStart(), JSON.stringify({}));
    btn.textContent='🔄 Refresh';
  } catch(e) {
    const nutData=estimateNutritionLocally(meals);
    renderNutrition(nutData);
    localStorage.setItem('rv_nut_'+getWeekStart(), JSON.stringify(nutData));
    btn.textContent='🔄 Refresh';
  }
  btn.disabled=false;
}
