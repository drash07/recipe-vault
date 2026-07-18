'use strict';

function renderMealSlots() {
  const slots      = document.getElementById('meal-slots');
  const mealTypes  = userProfile?.meal_types || ['breakfast','dinner'];
  const lunchStyle = userProfile?.lunch_style || 'leftovers';
  document.getElementById('selected-day-label').textContent = DAYS[selectedDay] + "'s meals";

  const day       = mealPlan[selectedDay] || {};
  const isWeekend = selectedDay === 5 || selectedDay === 6;
  const isRealMeal= m => m && m.source !== 'outside';
  const hasReal   = mealTypes.some(m => isRealMeal(day[m]));

  let html = '';
  if (isWeekend && !hasReal) {
    html += '<div class="card-sm" style="background:var(--berry-light);border-color:var(--berry);text-align:center;padding:16px 14px;margin-bottom:10px">' +
      '<div style="font-size:24px;margin-bottom:4px">🍽</div>' +
      '<div style="font-size:13px;font-weight:500;color:var(--berry)">Outside food / Cheat day</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-top:3px">Tap a slot below to cook at home instead</div>' +
    '</div>';
  }

  const slotIcons  = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍿' };
  const slotLabels = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' };

  mealTypes.forEach(m => {
    const meal  = day[m];
    const icon  = slotIcons[m]  || '🍽';
    const label = slotLabels[m] || m;

    if (m === 'lunch' && lunchStyle === 'leftovers') {
      const dinnerMeal = day['dinner'];
      html += '<div class="meal-slot leftovers">' +
        '<div class="meal-icon" style="background:var(--turmeric-light)">' + icon + '</div>' +
        '<div class="meal-info"><div class="meal-type">' + label + '</div>' +
          '<div class="meal-name" style="color:var(--text-muted)">' +
            (dinnerMeal ? '← ' + dinnerMeal.name + ' (leftovers)' : "Will use last night's dinner") +
          '</div></div>' +
      '</div>';
      return;
    }

    if (meal && meal.source !== 'outside') {
      html += '<div class="meal-slot filled" onclick="showRecipeDetail(' + meal.id + ')" style="cursor:pointer">' +
        '<div class="meal-icon">' + icon + '</div>' +
        '<div class="meal-info"><div class="meal-type">' + label + '</div>' +
          '<div class="meal-name">' + meal.name + '</div>' +
          '<div class="meal-meta">⏱ ' + meal.time + ' mins</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">' +
          '<button onclick="pickMeal(\'' + m + '\')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 7px;cursor:pointer;font-size:13px" title="Change">✏️</button>' +
          '<button onclick="removeMeal(\'' + m + '\')" style="background:none;border:1px solid #FFCDD2;border-radius:6px;padding:4px 7px;cursor:pointer;font-size:13px" title="Remove">🗑</button>' +
        '</div>' +
      '</div>';
    } else {
      html += '<div class="meal-slot" onclick="pickMeal(\'' + m + '\')">' +
        '<div class="meal-icon">' + icon + '</div>' +
        '<div class="meal-info"><div class="meal-type">' + label + '</div>' +
          '<div class="meal-name">Tap to plan ' + label.toLowerCase() + '</div>' +
        '</div>' +
        '<div style="color:var(--text-muted);font-size:16px">+</div>' +
      '</div>';
    }
  });

  slots.innerHTML = html;
}

// ── MEAL PICKING ──────────────────────────────────────────────────
function pickMeal(type) {
  pickingMealType = type;
  _pickType       = type;
  _pendingNewRecipe = null;
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  document.querySelector('#suggest-modal .modal-title').textContent = label + ' for ' + DAYS[selectedDay];
  document.getElementById('suggestions-content').innerHTML =
    '<input class="input" id="pick-search" placeholder="Search by name or ingredient..." oninput="filterPickCards(this.value)" style="margin-bottom:10px"/>' +
    '<div id="pick-body">' + _renderPickList(type, '') + '</div>';
  document.getElementById('suggest-btn').style.display = 'none';
  document.getElementById('suggest-modal').classList.add('open');
}

function filterPickCards(query) {
  const el = document.getElementById('pick-body');
  if (el && _pickType) el.innerHTML = _renderPickList(_pickType, query);
}

function _suitableRecipes(type, query) {
  const q      = (query || '').toLowerCase().trim();
  const source = userProfile?.plan_source || 'both';
  let pool     = recipes;
  if (source === 'mine')  pool = recipes.filter(r => r.user_id === currentUser?.id);
  if (source === 'vault') pool = recipes.filter(r => r.shared);
  return pool.filter(r => {
    const typeOk = type === 'breakfast' ? (r.type === 'Breakfast' || r.type === 'Both')
      : type === 'snack' ? r.type === 'Snack'
      : (r.type === 'Dinner' || r.type === 'Both' || r.type === 'Lunch');
    if (!typeOk) return false;
    if (!q) return true;
    const ing = (r.ingredients || []).join(' ').toLowerCase();
    return r.name.toLowerCase().includes(q) || ing.includes(q);
  });
}

function _renderPickList(type, query) {
  const q        = (query || '').trim();
  const suitable = _suitableRecipes(type, q);
  const cardsHtml= suitable.map(r => recipeCardHtml(r, 'assignMeal(' + r.id + ')', { showBadge: false, showSweetener: false, maxTags: 2 })).join('');

  const noMatch   = suitable.length === 0 && q;
  const qLabel    = q ? ' for <em>' + q + '</em>' : '';
  const createSection =
    '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">' +
      (noMatch ? '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-align:center">No recipes match <strong>' + q + '</strong>.</div>' : '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Not in the list? Create one:</div>') +
      '<div style="display:flex;gap:7px">' +
        '<button class="btn btn-primary btn-full btn-sm" id="pick-gen-btn" onclick="generateAndAssign()">✨ Generate' + qLabel + '</button>' +
        '<button class="btn btn-outline btn-full btn-sm" onclick="openAddModal();closeModal(\'suggest-modal\')">+ Add manually</button>' +
      '</div>' +
      '<div id="pick-gen-result"></div>' +
    '</div>';

  return (noMatch ? '' : '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Choose a ' + type + (q ? ' matching <em>' + q + '</em>' : '') + ' (' + suitable.length + '):</div>' + cardsHtml) + createSection;
}

async function generateAndAssign() {
  const searchEl = document.getElementById('pick-search');
  const ing      = searchEl ? searchEl.value.trim() : '';
  if (!ing) { showError('Type an ingredient or dish name in the search box first'); return; }
  const btn = document.getElementById('pick-gen-btn');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled  = true;
  const mealLabel = _pickType === 'breakfast' ? 'Breakfast' : _pickType === 'snack' ? 'Snack' : 'Dinner';
  const prompt    = 'Create a ' + buildProfileString(userProfile) + ' recipe for ' + mealLabel + ' using: ' + ing + '. Return ONLY JSON: {"name":"...","time":25,"type":"' + mealLabel + '","emoji":"🍛","tags":["tag1"],"ingredients":["qty ingredient"],"steps":["Step 1"]}';
  try {
    const data = parseAIJson(await callAI(prompt, 900));
    _pendingNewRecipe = { id:Date.now(), name:data.name, time:parseInt(data.time)||30, type:data.type||mealLabel, emoji:data.emoji||'🍽', tags:data.tags||[], ingredients:data.ingredients||[], steps:data.steps||[], source:'ai', board:null, shared:false };
    const r  = _pendingNewRecipe;
    const el = document.getElementById('pick-gen-result');
    if (el) el.innerHTML =
      '<div style="background:var(--leaf-light);border:1px solid var(--leaf);border-radius:var(--radius-sm);padding:11px;margin-top:10px">' +
        '<div style="font-size:14px;font-weight:500;margin-bottom:3px">' + r.emoji + ' ' + r.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:5px">⏱ ' + r.time + ' mins · ' + r.type + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">' + r.ingredients.slice(0,5).join(', ') + (r.ingredients.length>5?'…':'') + '</div>' +
        '<button class="btn btn-leaf btn-full btn-sm" onclick="saveAndAssign()">💾 Save to vault & plan for ' + DAYS[selectedDay] + '</button>' +
      '</div>';
  } catch(e) { showError('AI unavailable — no matching recipes found'); }
  if (btn) { btn.innerHTML = '✨ Generate'; btn.disabled = false; }
}

async function saveAndAssign() {
  if (!_pendingNewRecipe) return;
  const ok = await upsertRecipe(_pendingNewRecipe);
  if (!ok) return;
  recipes.push({ ..._pendingNewRecipe, user_id: currentUser.id });
  if (!mealPlan[selectedDay]) mealPlan[selectedDay] = {};
  mealPlan[selectedDay][pickingMealType] = _pendingNewRecipe;
  await saveMealSlot(selectedDay, pickingMealType, _pendingNewRecipe);
  closeModal('suggest-modal');
  renderWeekGrid();
  renderMealSlots();
  showStatus('Recipe saved and planned for ' + DAYS[selectedDay] + '!');
  _pendingNewRecipe = null;
}

async function assignMeal(id) {
  const r = recipes.find(x => x.id === id);
  if (!mealPlan[selectedDay]) mealPlan[selectedDay] = {};
  mealPlan[selectedDay][pickingMealType] = r;
  trackEvent('recipe_planned', {name: r.name, meal_type: pickingMealType});
  await saveMealSlot(selectedDay, pickingMealType, r);
  closeModal('suggest-modal');
  renderWeekGrid();
  renderMealSlots();
}

async function removeMeal(mealType) {
  if (!mealPlan[selectedDay]) return;
  mealPlan[selectedDay][mealType] = null;
  await saveMealSlot(selectedDay, mealType, null);
  renderWeekGrid();
  renderMealSlots();
}
