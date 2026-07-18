'use strict';

let editAnswers = {};

// ── PROFILE DATA ──────────────────────────────────────────────────
async function loadProfile(userId) {
  await db.auth.getSession();
  const { data, error } = await db.from('profiles').select('*').eq('user_id', userId).single();
  if (error || !data) return null;
  return data;
}

async function saveProfile(answers) {
  const payload = {
    user_id:         currentUser.id,
    display_name:    answers.display_name    || null,
    dietary_type:    answers.dietary_type    || 'vegetarian',
    eggs_ok:         answers.eggs_ok !== undefined ? answers.eggs_ok : true,
    sweet_pref:      answers.sweet_pref      || 'any',
    sweeteners:      answers.sweeteners      || [],
    allergies:       answers.allergies       || [],
    allergy_notes:   answers.allergy_notes   || null,
    household_size:  answers.household_size  || 1,
    cook_days:       answers.cook_days       || ['mon','tue','wed','thu','fri'],
    meal_types:      answers.meal_types      || ['breakfast','dinner'],
    lunch_style:     answers.lunch_style     || 'leftovers',
    time_weeknight:  answers.time_weeknight  || 30,
    nutrition_goals: answers.nutrition_goals || ['balanced'],
    plan_source:     'both',
    cuisine_roots:   'Indian'
  };
  const { error } = await db.from('profiles').upsert(payload);
  if (error) { showError('Could not save profile: ' + error.message); return false; }
  return true;
}

// ── PROFILE SCREEN ────────────────────────────────────────────────
function renderProfileScreen(mode) {
  if (mode === 'edit') { renderProfileEditMode(); return; }

  const p       = userProfile || {};
  const email   = currentUser?.email || '';
  const name    = p.display_name || email.split('@')[0];
  const initial = (name[0] || '?').toUpperCase();

  const dietLabel = { vegetarian:'Vegetarian', vegan:'Vegan', flexible:'Mostly Vegetarian' }[p.dietary_type] || 'Vegetarian';
  const chips     = ['<span class="chip-green">🌿 ' + dietLabel + '</span>'];
  if (p.dietary_type !== 'vegan' && p.eggs_ok) chips.push('<span class="chip">🥚 Eggs OK</span>');
  if (p.sweet_pref === 'alternatives') chips.push('<span class="chip-yellow">🍯 No refined sugar</span>');
  if (p.sweet_pref === 'none')         chips.push('<span class="chip-yellow">🚫 No sweets</span>');
  const allergyList = (p.allergies || []).filter(a => a !== 'none');
  allergyList.forEach(a => chips.push('<span class="chip" style="background:#FCE8EE;color:#A0294A">⚠️ No ' + a + '</span>'));

  const cookDays  = (p.cook_days  || ['mon','tue','wed','thu','fri']).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
  const mealTypes = (p.meal_types || ['breakfast','dinner']).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' · ');

  document.getElementById('profile-content').innerHTML =
    '<div class="card" style="margin-top:2px">' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:14px">' +
        '<div class="avatar" style="width:46px;height:46px;font-size:17px">' + initial + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:500;font-size:15px">' + name + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted)">' + dietLabel + ' · ' + mealTypes + '</div>' +
        '</div>' +
        '<button onclick="openEditProfile()" title="Edit preferences" style="background:none;border:none;cursor:pointer;font-size:17px;padding:4px 6px;color:var(--text-muted);line-height:1">✏️</button>' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:11px">' + chips.join('') + '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px">' +
        '<span class="chip">👥 ' + (p.household_size || 1) + ' person' + ((p.household_size || 1) > 1 ? 's' : '') + '</span>' +
        '<span class="chip">⏱ ' + (p.time_weeknight || 30) + ' min weeknights</span>' +
        '<span class="chip">📅 ' + cookDays + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px">' +
        '<button class="btn btn-outline btn-sm btn-full" onclick="openIgImport()">📸 Import from Instagram</button>' +
      '</div>' +
      '<button class="btn btn-danger btn-sm btn-full" onclick="signOut()">Sign out</button>' +
    '</div>';
}

function updateHeaderUser() {
  const name      = userProfile?.display_name || currentUser?.email?.split('@')[0] || '';
  const initial   = (name[0] || '?').toUpperCase();
  const avatarEl  = document.getElementById('header-avatar');
  const subtitleEl= document.getElementById('header-subtitle');
  if (avatarEl)   avatarEl.textContent  = initial;
  if (subtitleEl && name) subtitleEl.textContent = name + "'s kitchen, planned your way";
}

// ── PROFILE EDIT ──────────────────────────────────────────────────
function openEditProfile() {
  const p = userProfile || {};
  editAnswers = {
    display_name:    p.display_name   || '',
    dietary_type:    p.dietary_type,
    eggs_ok:         p.eggs_ok,
    sweet_pref:      p.sweet_pref,
    sweeteners:      [...(p.sweeteners    || [])],
    allergies:       [...(p.allergies     || [])],
    allergy_notes:   p.allergy_notes  || '',
    household_size:  p.household_size,
    cook_days:       [...(p.cook_days     || [])],
    meal_types:      [...(p.meal_types    || [])],
    lunch_style:     p.lunch_style,
    time_weeknight:  p.time_weeknight,
    nutrition_goals: [...(p.nutrition_goals || [])],
  };
  renderProfileScreen('edit');
}

function _editVisibleSteps() {
  return SETUP_STEPS.filter(s => {
    if (!s.condition) return true;
    if (s.id === 'eggs_ok')     return editAnswers.dietary_type !== 'vegan';
    if (s.id === 'sweeteners')  return editAnswers.sweet_pref === 'alternatives';
    if (s.id === 'lunch_style') { const mt = editAnswers.meal_types || []; return mt.includes('lunch') && mt.includes('dinner'); }
    return true;
  });
}

function editSelectSingle(id, value) { editAnswers[id] = value; renderProfileScreen('edit'); }

function editToggleMulti(id, value) {
  let arr = editAnswers[id] || [];
  if (value === 'none' || value === 'any') { arr = arr.includes(value) ? [] : [value]; }
  else { arr = arr.filter(v => v !== 'none' && v !== 'any'); arr.includes(value) ? (arr = arr.filter(v => v !== value)) : arr.push(value); }
  editAnswers[id] = arr;
  renderProfileScreen('edit');
}

function editToggleDay(value) {
  let arr = editAnswers.cook_days || [];
  arr.includes(value) ? (arr = arr.filter(v => v !== value)) : arr.push(value);
  editAnswers.cook_days = arr;
  renderProfileScreen('edit');
}

async function saveEditProfile() {
  const tf = document.getElementById('edit-text-display_name');
  if (tf) editAnswers.display_name = tf.value.trim();
  const nf = document.getElementById('edit-notes-allergies');
  if (nf) editAnswers.allergy_notes = nf.value.trim();
  const btn = document.getElementById('edit-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  const ok = await saveProfile(editAnswers);
  if (!ok) { if (btn) { btn.textContent = 'Save changes'; btn.disabled = false; } return; }
  const fresh = await loadProfile(currentUser?.id);
  if (fresh) userProfile = fresh;
  renderProfileScreen('view');
  renderFilterChips();
  updateHeaderUser();
}

function renderProfileEditMode() {
  const steps = _editVisibleSteps();
  let html    = '<div style="padding-bottom:20px">';

  steps.forEach(step => {
    const val = editAnswers[step.id];
    html += '<div style="margin-bottom:22px"><div class="section-label" style="margin-bottom:6px">' + step.question + '</div>';
    if (step.subtitle) html += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">' + step.subtitle + '</div>';

    if (step.type === 'text') {
      html += '<input class="input" id="edit-text-' + step.id + '" placeholder="' + (step.placeholder || '') + '" value="' + (val || '') + '" style="font-size:14px;padding:10px"/>';
    } else if (step.type === 'days') {
      const sel = val || [];
      html += '<div class="setup-days">' + step.options.map(o =>
        '<button class="setup-day ' + (sel.includes(o.value) ? 'selected' : '') + '" onclick="editToggleDay(\'' + o.value + '\')">' + o.label + '</button>'
      ).join('') + '</div>';
    } else if (step.type === 'multi') {
      const sel = val || [];
      html += '<div class="setup-options">' + step.options.map(o =>
        '<button class="setup-option ' + (sel.includes(o.value) ? 'selected' : '') + '" onclick="editToggleMulti(\'' + step.id + '\',\'' + o.value + '\')">' +
          '<span class="setup-option-emoji">' + (o.emoji || '') + '</span>' + o.label + '</button>'
      ).join('') + '</div>';
      if (step.hasNotes) html += '<textarea class="setup-notes" id="edit-notes-' + step.id + '" rows="2" placeholder="' + (step.notesPlaceholder || '') + '">' + (editAnswers.allergy_notes || '') + '</textarea>';
    } else {
      html += '<div class="setup-options">' + step.options.map(o => {
        const v = typeof o.value === 'string' ? "'" + o.value + "'" : o.value;
        return '<button class="setup-option ' + (val === o.value ? 'selected' : '') + '" onclick="editSelectSingle(\'' + step.id + '\',' + v + ')">' +
          '<span class="setup-option-emoji">' + (o.emoji || '') + '</span>' + o.label + '</button>';
      }).join('') + '</div>';
    }
    html += '</div>';
  });

  html +=
    '<div style="display:flex;gap:8px;margin-top:8px;padding-bottom:8px">' +
      '<button class="btn btn-outline btn-sm" onclick="renderProfileScreen(\'view\')" style="flex:1">Cancel</button>' +
      '<button class="btn btn-primary btn-sm" id="edit-save-btn" onclick="saveEditProfile()" style="flex:2">Save changes</button>' +
    '</div></div>';

  document.getElementById('profile-content').innerHTML = html;
}
