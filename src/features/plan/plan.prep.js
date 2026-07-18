'use strict';

function buildPrepTimelineLocally(meals) {
  const NOISE=new Set(['fresh','frozen','cooked','dried','raw','ripe','hot','warm','whole','large','medium','small','extra','firm','soaked','boiled','roasted','halved','diced','chopped','sliced','grated','minced','crushed','peeled','seeded','optional','or','and','to','for','of','a','an','the']);
  function ingName(ing){let s=ing.replace(/^[\d\s\/.]+(?:cups?|tbsp?|tsp?|g|kg|oz|lb|ml|bunch(?:es)?|cloves?|cans?|medium|large|small|inch|handful|pinch|sprigs?|stalks?)\s*/gi,'').trim();s=s.replace(/\s*[\(,].*$/,'').replace(/\s*(chopped|diced|sliced|grated|minced|crushed|peeled|soaked|boiled|roasted|optional|to taste|for serving|for garnish|as needed|overnight).*/gi,'').trim();const words=s.split(/\s+/).filter(w=>w.length>1&&!NOISE.has(w.toLowerCase()));return words.slice(0,2).join(' ').toLowerCase();}
  const ingCount={};
  meals.forEach(m=>{const r=recipes.find(x=>x.name===m.name);if(!r||!r.ingredients)return;const seen=new Set();r.ingredients.forEach(ing=>{const key=ingName(ing);if(key.length>2&&!seen.has(key)){seen.add(key);ingCount[key]=(ingCount[key]||0)+1;}});});
  const shared=Object.entries(ingCount).filter(([,v])=>v>1).map(([k])=>k);
  const chopable=shared.filter(k=>/onion|tomato|pepper|garlic|ginger|carrot|celery|cucumber|coriander|spinach|paneer/.test(k));
  const measureable=shared.filter(k=>!chopable.includes(k)).slice(0,3);
  const tips=[];
  if(chopable.length)tips.push({type:'batch',title:'Batch-chop: '+chopable.slice(0,3).join(', '),detail:'Used in multiple meals this week. Chop together on Sunday and refrigerate (keeps 3 days).',saves:'10–15 min on each cook day'});
  else if(measureable.length)tips.push({type:'batch',title:'Pre-measure ingredients',detail:measureable.join(', ')+' appear in multiple recipes — portion them on Sunday.',saves:'5–10 min per meal'});
  const needsSoak=meals.filter(m=>{const r=recipes.find(x=>x.name===m.name);return r&&r.ingredients&&r.ingredients.some(i=>/overnight|soaked? [\d]|rajma|chickpea|chana/i.test(i));});
  if(needsSoak.length)tips.push({type:'reuse',title:'Soak overnight: '+needsSoak.slice(0,2).map(m=>m.name).join(' & '),detail:"Put them in water Saturday evening so they're ready Sunday/Monday.",saves:'30–60 min cook time'});
  const slow=meals.filter(m=>(m.time||0)>25&&!needsSoak.find(n=>n.name===m.name));
  if(slow.length)tips.push({type:'reuse',title:'Double-batch: '+slow.slice(0,2).map(m=>m.name).join(' & '),detail:'These take 25+ min. Cook a larger portion on the weekend — reheats in 5 min on weeknights.',saves:'One full cook session mid-week'});
  const tasks=[];
  if(needsSoak.length)tasks.push({name:'Saturday night: soak '+needsSoak.slice(0,2).map(m=>m.name.split(' ')[0]).join(' & '),detail:'Cover with water in a bowl. Leave overnight.',time_mins:5});
  if(chopable.length)tasks.push({name:'Chop & store: '+chopable.slice(0,3).join(', '),detail:'Store in airtight containers in fridge. Keeps 3 days.',time_mins:20});
  slow.slice(0,2).forEach(m=>{const r=recipes.find(x=>x.name===m.name);const step=r&&r.steps&&r.steps[0]?r.steps[0].slice(0,90):('Follow the recipe steps — store extra in fridge.');tasks.push({name:'Cook & store extra: '+m.name,detail:step,time_mins:m.time||30});});
  return{tips,schedule:tasks.length?[{day:'Sunday',tasks}]:[],isEstimate:true};
}

function renderPrepHtml(parsed) {
  let html='';
  if(parsed.isEstimate)html+='<div class="ai-tip" style="background:#FEF8EE;border:1px solid #F0C96A">📋 <strong>Smart estimate</strong> — based on your planned recipes.</div>';
  if(parsed.tips&&parsed.tips.length){
    html+='<div class="section-label">Smart tips</div>';
    parsed.tips.forEach(t=>{html+='<div class="prep-task '+t.type+'" style="margin-bottom:7px"><div class="prep-task-name">'+(t.type==='batch'?'🔁':'♻️')+' '+t.title+'</div><div class="prep-task-detail">'+t.detail+'</div>'+(t.saves?'<div style="margin-top:4px;font-size:10px;color:var(--leaf);font-weight:500">⏱ Saves: '+t.saves+'</div>':'')+'</div>';});
  }
  if(parsed.schedule&&parsed.schedule.length){
    html+='<div class="section-label">Day-by-day schedule</div>';
    parsed.schedule.forEach(s=>{if(!s.tasks||!s.tasks.length)return;html+='<div class="prep-day-header">'+s.day+'</div>';s.tasks.forEach(t=>{html+='<div class="prep-task" style="margin-left:20px"><div class="prep-task-name">'+t.name+' <span style="font-size:10px;color:var(--text-muted)">~'+t.time_mins+' min</span></div><div class="prep-task-detail">'+t.detail+'</div></div>';});});
  }
  return html||'<div style="font-size:12px;color:var(--text-muted)">All quick meals — no batch prep needed!</div>';
}

async function generatePrepTimeline() {
  const btn=document.getElementById('prep-btn');
  btn.innerHTML='<span class="spinner"></span> Planning...'; btn.disabled=true;
  const mealTypes=userProfile?.meal_types||['breakfast','dinner'];
  const meals=[];
  Object.entries(mealPlan).forEach(([dayIdx,day])=>{
    mealTypes.forEach(m=>{if(day&&day[m]&&day[m].source!=='outside')meals.push({day:DAYS[dayIdx],meal:m,name:day[m].name,time:day[m].time});});
  });
  if(!meals.length){document.getElementById('prep-timeline-content').innerHTML='<div style="font-size:12px;color:var(--text-muted)">No meals planned yet.</div>';btn.textContent='⏱ Generate prep timeline';btn.disabled=false;return;}
  let parsed;
  try{
    const prompt='Smart meal prep coach. Profile: '+buildProfileString(userProfile)+'. Week meals: '+meals.map(m=>m.day+' '+m.meal+': '+m.name+' ('+m.time+'min)').join(', ')+'. Identify batch-cook opportunities and a day-by-day schedule. JSON only: {"tips":[{"type":"batch","title":"","detail":"","saves":""}],"schedule":[{"day":"Sunday","tasks":[{"name":"","detail":"","time_mins":15}]}]}';
    parsed=parseAIJson(await callAI(prompt,1200));
  }catch(e){parsed=buildPrepTimelineLocally(meals);}
  document.getElementById('prep-timeline-content').innerHTML=renderPrepHtml(parsed);
  localStorage.setItem('rv_prep_'+getWeekStart(),JSON.stringify(parsed));
  if(parsed.tips&&parsed.tips[0]){document.getElementById('prep-tip-banner').querySelector('.prep-banner-text').innerHTML='<strong>Tip:</strong> '+parsed.tips[0].title+' — '+parsed.tips[0].detail;}
  btn.textContent='🔄 Regenerate'; btn.disabled=false;
}
