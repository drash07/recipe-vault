'use strict';

// ── AI SUGGESTIONS ────────────────────────────────────────────────
function openSuggestModal() {
  const profileStr = buildProfileString(userProfile);
  document.getElementById('suggestions-content').innerHTML =
    '<div style="text-align:center;padding:18px 0;color:var(--text-muted);font-size:13px">' + profileStr + '</div>';
  document.getElementById('suggest-btn').style.display   = '';
  document.getElementById('suggest-btn').textContent     = 'Get suggestions for this day';
  document.getElementById('suggest-modal').classList.add('open');
}

async function getSuggestions() {
  aiSuggestions = [];
  const btn = document.getElementById('suggest-btn');
  btn.innerHTML = '<span class="spinner"></span> Getting suggestions...';
  btn.disabled  = true;

  const mealTypes  = userProfile?.meal_types || ['breakfast','dinner'];
  const wantBfast  = mealTypes.includes('breakfast');
  const wantDinner = mealTypes.includes('dinner');
  const prompt     = 'Generate ' + (wantBfast?'1 breakfast and ':'') + (wantDinner?'1 dinner ':' a ') +
    'recipe for a home cook with this profile: ' + buildProfileString(userProfile) +
    '. Be creative. Return JSON only: {"suggestions":[{"meal":"Breakfast","name":"...","emoji":"🥣","time":15,"reason":"one short sentence"},{"meal":"Dinner","name":"...","emoji":"🍛","time":25,"reason":"one short sentence"}]}';

  try {
    const data        = parseAIJson(await callAI(prompt, 400));
    const suggestions = (data.suggestions || []).filter(s => (s.meal==='Breakfast'&&wantBfast)||(s.meal==='Dinner'&&wantDinner));
    if (!suggestions.length) throw new Error('empty');

    let html = '<div class="ai-tip">✨ <strong>AI suggestions for ' + DAYS[selectedDay] + '</strong></div>';
    suggestions.forEach(s => {
      const idx   = aiSuggestions.length;
      const entry = { r:{ id:'ai_'+Date.now()+idx, name:s.name, emoji:s.emoji||'🍽', time:s.time||25, type:s.meal, tags:[], ingredients:[], steps:[], source:'ai', board:null }, type:s.meal, reason:s.reason };
      aiSuggestions.push(entry);
      html += '<div class="ai-card">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">' +
          '<span style="font-size:20px">' + (s.emoji||'🍽') + '</span>' +
          '<div><strong style="font-size:13px">' + s.name + '</strong>' +
          '<div style="font-size:10px;color:var(--text-muted)">' + s.meal + ' · ⏱ ' + (s.time||25) + 'm</div></div>' +
        '</div>' +
        (s.reason?'<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;line-height:1.4">' + s.reason + '</div>':'') +
        '<button class="btn btn-primary btn-sm btn-full" onclick="addAiRecipeStored(' + idx + ',\'' + s.meal + '\')">+ Plan for ' + DAYS[selectedDay] + '</button>' +
      '</div>';
    });
    document.getElementById('suggestions-content').innerHTML = html;
    btn.textContent = '🔀 New suggestions';
    btn.disabled    = false;
  } catch(e) {
    if (e.isRateLimit) {
      document.getElementById('suggestions-content').innerHTML =
        '<div class="ai-tip" style="background:#FEF8EE;border-color:#F0C96A;text-align:center">⏱ <strong>Too many requests</strong><br/><span style="font-size:11px;color:var(--text-muted)">Wait a moment and try again.</span></div>';
      btn.textContent = '🔄 Try again';
      btn.disabled    = false;
      return;
    }
    const shuffle = arr => [...arr].sort(() => Math.random()-.5);
    const bfast   = shuffle(recipes.filter(r => r.type==='Breakfast'||r.type==='Both'))[0];
    const dinner  = shuffle(recipes.filter(r => r.type==='Dinner'||r.type==='Both'))[0];
    let html = '<div class="ai-tip">💡 AI unavailable — from your vault</div>';
    [{ r:bfast, type:'Breakfast' },{ r:dinner, type:'Dinner' }]
      .filter(e => e.r && ((e.type==='Breakfast'&&mealTypes.includes('breakfast'))||(e.type==='Dinner'&&mealTypes.includes('dinner'))))
      .forEach(entry => {
        const idx = aiSuggestions.length;
        aiSuggestions.push(entry);
        html += '<div class="ai-card"><div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><span style="font-size:20px">' + (entry.r.emoji||'🍽') + '</span><div><strong style="font-size:13px">' + entry.r.name + '</strong><div style="font-size:10px;color:var(--text-muted)">' + entry.type + ' · ⏱ ' + entry.r.time + 'm</div></div></div>' +
          '<button class="btn btn-primary btn-sm btn-full" onclick="addAiRecipeStored(' + idx + ',\'' + entry.type + '\')">+ Plan for ' + DAYS[selectedDay] + '</button></div>';
      });
    document.getElementById('suggestions-content').innerHTML = html;
    btn.textContent = '🔀 New suggestions';
    btn.disabled    = false;
  }
}

async function addAiRecipeStored(idx, type) {
  const entry = aiSuggestions[idx];
  if (!entry) return;
  if (!mealPlan[selectedDay]) mealPlan[selectedDay] = {};
  mealPlan[selectedDay][type.toLowerCase()] = entry.r;
  trackEvent('ai_suggestion_used', {name: entry.r.name, meal: type});
  await saveMealSlot(selectedDay, type.toLowerCase(), entry.r);
  closeModal('suggest-modal');
  renderWeekGrid();
  renderMealSlots();
}

// ── SMART MEAL PLANNER ────────────────────────────────────────────
function openSmartPlanModal() {
  smartPlanResult    = null;
  _smartPlanModified = false;
  document.getElementById('smart-plan-content').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px"><span class="spinner" style="border-top-color:var(--saffron)"></span></div>';
  const saveBtn = document.getElementById('smart-plan-save-btn');
  saveBtn.style.display = 'none';
  saveBtn.disabled      = true;
  const source = userProfile?.plan_source || 'both';
  document.getElementById('plan-source-selector').innerHTML = 'Plan from: ' +
    ['mine','vault','both'].map(v =>
      '<button class="btn btn-sm ' + (source===v?'btn-primary':'btn-outline') + '" style="margin-left:5px" onclick="setPlanSource(\'' + v + '\',this)">' + v.charAt(0).toUpperCase()+v.slice(1) + '</button>'
    ).join('');
  document.getElementById('smart-plan-modal').classList.add('open');
  generateSmartPlan();
}

function setPlanSource(val, el) {
  if (userProfile) userProfile.plan_source = val;
  document.querySelectorAll('#plan-source-selector .btn').forEach(b => {
    b.className = b === el ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    b.style.marginLeft = '5px';
  });
  generateSmartPlan();
}

function generateSmartPlan() {
  const shuffle   = arr => [...arr].sort(() => Math.random()-.5);
  const source    = userProfile?.plan_source || 'both';
  const cookDays  = userProfile?.cook_days   || ['mon','tue','wed','thu','fri'];
  const mealTypes = userProfile?.meal_types  || ['breakfast','dinner'];
  const dayMap    = { mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6 };
  const cookSet   = new Set(cookDays.map(d => dayMap[d.toLowerCase()]));
  let pool        = recipes;
  if (source === 'mine')  pool = recipes.filter(r => r.user_id === currentUser?.id);
  if (source === 'vault') pool = recipes.filter(r => r.shared);
  const dinners = shuffle(pool.filter(r => r.type==='Dinner'||r.type==='Both'));
  const bfasts  = shuffle(pool.filter(r => r.type==='Breakfast'||r.type==='Both'));
  const snacks  = shuffle(pool.filter(r => r.type==='Snack'));
  const plan    = [];
  let dIdx=0, bIdx=0, sIdx=0;
  for (let i=0; i<7 && plan.length<cookDays.length; i++) {
    const dayIdx  = (todayIdx + i) % 7;
    if (!cookSet.has(dayIdx)) continue;
    const entry   = { dayName:FULL_DAYS[dayIdx], dayIndex:dayIdx, isOutside:false };
    if (mealTypes.includes('breakfast') && bfasts.length)  entry.breakfast = bfasts[bIdx++%bfasts.length].name;
    if (mealTypes.includes('dinner')    && dinners.length) entry.dinner    = dinners[dIdx++%dinners.length].name;
    if (mealTypes.includes('snack')     && snacks.length)  entry.snack     = snacks[sIdx++%snacks.length].name;
    plan.push(entry);
  }
  smartPlanResult    = plan;
  _smartPlanModified = false;
  renderSmartPlan(plan);
  const saveBtn = document.getElementById('smart-plan-save-btn');
  saveBtn.style.display = '';
  saveBtn.disabled      = true;
}

function renderSmartPlan(plan) {
  const mealTypes = userProfile?.meal_types || ['breakfast','dinner'];
  let html = '';
  plan.forEach((day, i) => {
    html += '<div class="card-sm" style="border-left:3px solid var(--leaf);margin-bottom:8px">' +
      '<div style="font-size:13px;font-weight:500;margin-bottom:6px">' + day.dayName + ' <span style="font-size:10px;background:var(--leaf-light);color:var(--leaf);padding:1px 6px;border-radius:8px;font-weight:600">Home</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px">';
    const slots = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍿' };
    mealTypes.forEach(m => {
      if (m === 'lunch' || !day[m]) return;
      html += '<div style="display:flex;align-items:center;gap:6px">' +
        '<span style="font-size:13px">' + slots[m] + '</span>' +
        '<span style="font-size:12px;flex:1">' + day[m] + '</span>' +
        '<button class="btn btn-outline" style="padding:2px 7px;font-size:10px;border-radius:6px" onclick="swapMeal(' + i + ',&quot;' + m + '&quot;)">swap</button>' +
      '</div>';
    });
    html += '</div></div>';
  });
  if (!html) html = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px">No recipes in your selected pool. Try switching to "Both".</div>';
  document.getElementById('smart-plan-content').innerHTML = html;
}

function swapMeal(planIdx, mealType) {
  if (!smartPlanResult) return;
  const day     = smartPlanResult[planIdx];
  const source  = userProfile?.plan_source || 'both';
  let pool      = recipes;
  if (source==='mine')  pool = recipes.filter(r => r.user_id===currentUser?.id);
  if (source==='vault') pool = recipes.filter(r => r.shared);
  const suitable= pool.filter(r =>
    mealType==='breakfast' ? (r.type==='Breakfast'||r.type==='Both') :
    mealType==='snack'     ? r.type==='Snack' : (r.type==='Dinner'||r.type==='Both')
  );
  let html = '<div style="margin-bottom:8px;font-size:12px;font-weight:500">Pick a ' + mealType + ' for ' + day.dayName + ':</div><div style="max-height:260px;overflow-y:auto">';
  window.__swapOptions  = suitable;
  window.__swapPlanIdx  = planIdx;
  window.__swapMealType = mealType;
  suitable.forEach((r,ri) => {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="applySwapByIndex(' + ri + ')">' +
      '<span style="font-size:18px">' + (r.emoji||'🍽') + '</span>' +
      '<div><div style="font-size:12px;font-weight:500">' + r.name + '</div><div style="font-size:10px;color:var(--text-muted)">⏱ ' + r.time + 'm</div></div>' +
    '</div>';
  });
  html += '</div><button class="btn btn-outline btn-sm btn-full" style="margin-top:8px" onclick="renderSmartPlan(smartPlanResult)">← Back</button>';
  document.getElementById('smart-plan-content').innerHTML = html;
}

function applySwapByIndex(ri) {
  const r = window.__swapOptions[ri];
  if (r) applySwap(window.__swapPlanIdx, window.__swapMealType, r.name);
}

function applySwap(planIdx, mealType, recipeName) {
  if (!smartPlanResult) return;
  smartPlanResult[planIdx][mealType] = recipeName;
  _smartPlanModified = true;
  document.getElementById('smart-plan-save-btn').disabled = false;
  renderSmartPlan(smartPlanResult);
}

async function saveSmartPlan() {
  if (!smartPlanResult) return;
  const btn = document.getElementById('smart-plan-save-btn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled  = true;
  for (const day of smartPlanResult) {
    const dayIdx = day.dayIndex;
    if (!mealPlan[dayIdx]) mealPlan[dayIdx] = {};
    for (const m of ['breakfast','dinner','snack']) {
      if (!day[m]) continue;
      const rec = recipes.find(r => r.name===day[m]);
      if (rec) { mealPlan[dayIdx][m] = rec; await saveMealSlot(dayIdx, m, rec); }
    }
  }
  localStorage.removeItem('rv_nut_'  + getWeekStart());
  localStorage.removeItem('rv_prep_' + getWeekStart());
  closeModal('smart-plan-modal');
  renderWeekGrid();
  renderMealSlots();
  showStatus('Plan saved! ✓', 'var(--leaf)');
  setTimeout(hideStatus, 2000);
  btn.textContent = '✓ Save this plan';
  btn.disabled    = false;
}
