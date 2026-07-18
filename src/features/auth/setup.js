'use strict';

// ── SETUP WIZARD STEPS ────────────────────────────────────────────
const SETUP_STEPS = [
  { id:'display_name', question:'First things first — what should we call you?', type:'text', placeholder:'Your name or nickname' },
  { id:'dietary_type', question:'How do you roll in the kitchen?', type:'single', options:[
    { value:'vegetarian', label:'Strictly vegetarian',          emoji:'🌿' },
    { value:'flexible',   label:'Mostly veg, flexible sometimes', emoji:'🥗' },
    { value:'vegan',      label:'Fully plant-based (vegan)',    emoji:'🌱' }
  ]},
  { id:'eggs_ok', question:'Eggs on the menu?', type:'single', condition:()=>setupAnswers.dietary_type!=='vegan', options:[
    { value:true,  label:'Yes, eggs are fine',    emoji:'✅' },
    { value:false, label:'Nope, I skip those too', emoji:'❌' }
  ]},
  { id:'sweet_pref', question:'Got a sweet tooth but trying to dodge refined sugar?', type:'single', options:[
    { value:'alternatives', label:'Yes — I love sweets but want healthier options', emoji:'🍬' },
    { value:'any',          label:'No preference — regular sugar is fine',          emoji:'🍭' },
    { value:'none',         label:'I skip sweets altogether',                        emoji:'🚫' }
  ]},
  { id:'sweeteners', question:'Which sweeteners do you cook with?', subtitle:'Pick all that apply', type:'multi', condition:()=>setupAnswers.sweet_pref==='alternatives', options:[
    { value:'jaggery', label:'Jaggery',      emoji:'🌿' },
    { value:'honey',   label:'Honey',        emoji:'🍯' },
    { value:'dates',   label:'Dates',        emoji:'🌴' },
    { value:'maple',   label:'Maple syrup',  emoji:'🍁' },
    { value:'any',     label:'Whatever works', emoji:'🤷' }
  ]},
  { id:'allergies', question:"Anything your kitchen should stay away from?", subtitle:'Pick all that apply', type:'multi', hasNotes:true, notesPlaceholder:'Anything else to avoid? (optional)', options:[
    { value:'gluten',  label:'Gluten',  emoji:'🌾' },
    { value:'nuts',    label:'Nuts',    emoji:'🥜' },
    { value:'dairy',   label:'Dairy',   emoji:'🥛' },
    { value:'soy',     label:'Soy',     emoji:'🫘' },
    { value:'peanuts', label:'Peanuts', emoji:'🥜' },
    { value:'sesame',  label:'Sesame',  emoji:'✨' },
    { value:'none',    label:'None of the above', emoji:'✅' }
  ]},
  { id:'household_size', question:"Who's eating?", type:'single', options:[
    { value:1, label:'Just me',           emoji:'🙋'    },
    { value:2, label:'Me + partner',      emoji:'👫'    },
    { value:4, label:'Small family (3–4)', emoji:'👨‍👩‍👦' },
    { value:6, label:'Big family (5+)',   emoji:'🏠'    }
  ]},
  { id:'cook_days', question:'Which days are you usually in the kitchen?', subtitle:'Pick your cook days — auto-plan will only fill these', type:'days', options:[
    { value:'mon', label:'Mon' },{ value:'tue', label:'Tue' },{ value:'wed', label:'Wed' },
    { value:'thu', label:'Thu' },{ value:'fri', label:'Fri' },{ value:'sat', label:'Sat' },{ value:'sun', label:'Sun' }
  ]},
  { id:'meal_types', question:'What meals do you want to plan and shop for?', subtitle:'Pick all that apply', type:'multi', options:[
    { value:'breakfast', label:'Breakfast', emoji:'🌅' },
    { value:'lunch',     label:'Lunch',     emoji:'☀️' },
    { value:'dinner',    label:'Dinner',    emoji:'🌙' },
    { value:'snack',     label:'Snacks',    emoji:'🍿' }
  ]},
  { id:'lunch_style', question:'How do you usually handle lunch?', type:'single', condition:()=>{ const mt=setupAnswers.meal_types||[]; return mt.includes('lunch')&&mt.includes('dinner'); }, options:[
    { value:'leftovers', label:'Cook dinner, eat leftovers for lunch', emoji:'🥡' },
    { value:'fresh',     label:'Cook lunch fresh each day',            emoji:'🍳' },
    { value:'batch',     label:'Batch cook, portion through the week', emoji:'📦' }
  ]},
  { id:'time_weeknight', question:'Busy weeknight — how long can you realistically cook?', type:'single', options:[
    { value:20, label:'20 mins or less',  emoji:'⚡' },
    { value:30, label:'Around 30 mins',   emoji:'🕐' },
    { value:45, label:'Up to 45 mins',    emoji:'🕑' },
    { value:60, label:'An hour is fine',  emoji:'🍳' }
  ]},
  { id:'nutrition_goals', question:'What does your body need most right now?', subtitle:'Pick all that apply', type:'multi', options:[
    { value:'balanced', label:'Well-balanced (bit of everything)', emoji:'⚖️' },
    { value:'protein',  label:'High protein',                      emoji:'💪' },
    { value:'fibre',    label:'More fibre',                        emoji:'🌾' },
    { value:'heart',    label:'Heart healthy (low fat)',           emoji:'🫀' },
    { value:'energy',   label:'High energy',                       emoji:'⚡' },
    { value:'light',    label:'Light & low-calorie',               emoji:'🥗' },
    { value:'calcium',  label:'Calcium-rich',                      emoji:'🦴' }
  ]}
];

let setupStep     = 0;
let setupAnswers  = {};
let _setupVisible = [];

// ── WIZARD RENDERING ──────────────────────────────────────────────
function _visibleSteps() {
  return SETUP_STEPS.filter(s => !s.condition || s.condition());
}

function renderSetupStep() {
  _setupVisible = _visibleSteps();
  const total = _setupVisible.length;
  const step  = _setupVisible[setupStep];
  const val   = setupAnswers[step.id];

  let dots = '';
  for (let i = 0; i < total; i++) {
    const cls = i < setupStep ? 'done' : i === setupStep ? 'active' : '';
    dots += '<div class="setup-progress-dot ' + cls + '"></div>';
  }

  let optionsHtml = '';

  if (step.type === 'text') {
    optionsHtml = '<div class="input-group"><input class="input" id="setup-text-field" placeholder="' + (step.placeholder || '') + '" value="' + (val || '') + '" onkeydown="if(event.key===\'Enter\')nextSetup()" style="font-size:15px;padding:12px"/></div>';
  } else if (step.type === 'days') {
    const selected = val || ['mon','tue','wed','thu','fri'];
    optionsHtml = '<div class="setup-days">' + step.options.map(o =>
      '<button class="setup-day ' + (selected.includes(o.value) ? 'selected' : '') + '" onclick="toggleDay(\'' + o.value + '\')">' + o.label + '</button>'
    ).join('') + '</div>';
  } else if (step.type === 'multi') {
    const selected = val || [];
    optionsHtml = '<div class="setup-options">' + step.options.map(o =>
      '<button class="setup-option ' + (selected.includes(o.value) ? 'selected' : '') + '" onclick="toggleMulti(\'' + step.id + '\',\'' + o.value + '\')">' +
        '<span class="setup-option-emoji">' + (o.emoji || '') + '</span>' + o.label +
      '</button>'
    ).join('') + '</div>' +
    (step.hasNotes ? '<textarea class="setup-notes" id="setup-notes-field" rows="2" placeholder="' + (step.notesPlaceholder || '') + '">' + (setupAnswers.allergy_notes || '') + '</textarea>' : '');
  } else {
    optionsHtml = '<div class="setup-options">' + step.options.map(o => {
      const v = typeof o.value === 'string' ? "'" + o.value + "'" : o.value;
      return '<button class="setup-option ' + (val === o.value ? 'selected' : '') + '" onclick="selectSingle(\'' + step.id + '\',' + v + ')">' +
        '<span class="setup-option-emoji">' + (o.emoji || '') + '</span>' + o.label + '</button>';
    }).join('') + '</div>';
  }

  const needsNext = step.type === 'text' || step.type === 'multi' || step.type === 'days';
  const navHtml   = needsNext
    ? '<div class="setup-nav">' +
        (setupStep > 0 ? '<button class="btn btn-outline btn-sm" onclick="backSetup()" style="flex:1">← Back</button>' : '') +
        '<button class="btn btn-primary btn-sm" onclick="nextSetup()" style="flex:2">' + (setupStep === total - 1 ? 'Finish →' : 'Next →') + '</button>' +
      '</div>'
    : (setupStep > 0 ? '<button class="btn btn-outline btn-sm btn-full" onclick="backSetup()" style="margin-top:8px">← Back</button>' : '');

  document.getElementById('setup-body').innerHTML =
    '<div class="setup-progress">' + dots + '</div>' +
    '<div class="setup-question">' + step.question + '</div>' +
    (step.subtitle ? '<div class="setup-sub">' + step.subtitle + '</div>' : '') +
    optionsHtml + navHtml;
}

function selectSingle(id, value) { setupAnswers[id] = value; advanceSetup(); }

function toggleMulti(id, value) {
  let arr = setupAnswers[id] || [];
  if (value === 'none' || value === 'any') { arr = arr.includes(value) ? [] : [value]; }
  else { arr = arr.filter(v => v !== 'none' && v !== 'any'); arr.includes(value) ? (arr = arr.filter(v => v !== value)) : arr.push(value); }
  setupAnswers[id] = arr;
  renderSetupStep();
}

function toggleDay(value) {
  let arr = setupAnswers.cook_days || ['mon','tue','wed','thu','fri'];
  arr.includes(value) ? (arr = arr.filter(v => v !== value)) : arr.push(value);
  setupAnswers.cook_days = arr;
  renderSetupStep();
}

function nextSetup() {
  const step = _setupVisible[setupStep];
  const tf   = document.getElementById('setup-text-field');
  if (tf) setupAnswers[step.id] = tf.value.trim();
  const nf   = document.getElementById('setup-notes-field');
  if (nf) setupAnswers.allergy_notes = nf.value.trim();
  if (!setupAnswers[step.id] || setupAnswers[step.id].length === 0) {
    if (step.type === 'days')  setupAnswers[step.id] = ['mon','tue','wed','thu','fri'];
    if (step.type === 'multi') setupAnswers[step.id] = [];
  }
  advanceSetup();
}

function backSetup()  { if (setupStep > 0) { setupStep--; renderSetupStep(); } }

async function advanceSetup() {
  _setupVisible = _visibleSteps();
  if (setupStep < _setupVisible.length - 1) { setupStep++; renderSetupStep(); }
  else { await submitProfile(); }
}

async function submitProfile() {
  const btn = document.getElementById('setup-finish-btn');
  if (btn) { btn.innerHTML = '<span class="spinner" style="border-top-color:var(--saffron)"></span>'; btn.disabled = true; }
  const ok = await saveProfile(setupAnswers);
  if (!ok) { if (btn) { btn.textContent = 'Finish →'; btn.disabled = false; } return; }
  userProfile = await loadProfile(currentUser.id);
  trackEvent('onboarding_completed');
  showApp();
  updateHeaderUser();
  renderProfileScreen();
  await loadRecipes();
  await loadMealPlan();
  await loadGroceries();
}
