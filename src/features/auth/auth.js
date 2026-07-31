'use strict';

// ── OVERLAY CONTROLS ──────────────────────────────────────────────
function showLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('setup-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  const hasLoggedInBefore = !!localStorage.getItem('rv_has_logged_in');
  const titleEl = document.getElementById('login-title');
  if (titleEl) titleEl.textContent = hasLoggedInBefore ? 'Welcome back' : 'Welcome';
}

function showSetupOverlay() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('setup-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  setupStep    = 0;
  setupAnswers = {};
  renderSetupStep();
}

function showApp() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('setup-overlay').style.display = 'none';
  document.getElementById('app').style.display = '';
}

// ── AUTH ACTIONS ──────────────────────────────────────────────────
async function sendOtp() {
  const email = document.getElementById('login-email').value.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('login-error').textContent = 'Please enter a valid email address.';
    return;
  }
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled  = true;
  document.getElementById('login-error').textContent = '';

  const { error } = await db.auth.signInWithOtp({ email });

  if (error) {
    document.getElementById('login-error').textContent = error.message;
    btn.textContent = 'Send code';
    btn.disabled    = false;
  } else {
    _pendingOtpEmail = email;
    document.getElementById('login-step-1').style.display = 'none';
    document.getElementById('login-step-2').style.display = 'block';
    document.getElementById('login-sent-email').textContent = email;
    document.getElementById('login-otp').value = '';
    document.getElementById('login-otp-error').textContent = '';
  }
}

async function verifyOtp() {
  const code = document.getElementById('login-otp').value.trim();
  if (code.length !== 6) {
    document.getElementById('login-otp-error').textContent = 'Please enter the 6-digit code from your email.';
    return;
  }
  const btn = document.getElementById('verify-btn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled  = true;
  document.getElementById('login-otp-error').textContent = '';

  const { error } = await db.auth.verifyOtp({ email: _pendingOtpEmail, token: code, type: 'email' });

  if (error) {
    document.getElementById('login-otp-error').textContent = error.message;
    btn.textContent = 'Verify';
    btn.disabled    = false;
  }
}

async function resendOtp() {
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-email').value = _pendingOtpEmail;
  await sendOtp();
}

function resetLoginForm() {
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('login-email').value           = '';
  document.getElementById('login-error').textContent     = '';
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Send code';
  btn.disabled    = false;
}

async function resendMagicLink() {
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('login-step-1').style.display = 'block';
}

async function signOut() {
  await db.auth.signOut();
}

// ── SESSION HANDLING ──────────────────────────────────────────────
function _devBypass() {
  currentUser = { id: 'd7951e99-539e-4a58-82de-ea7267d27c74', email: 'pateldrashti05@hotmail.com' };
  userProfile = {
    user_id: 'd7951e99-539e-4a58-82de-ea7267d27c74', display_name: 'Drashti',
    dietary_type: 'vegetarian', eggs_ok: true, sweet_pref: 'alternatives',
    sweeteners: ['jaggery','honey','dates'], allergies: [], household_size: 2,
    cook_days: ['mon','tue','wed','thu','fri'], meal_types: ['breakfast','dinner'],
    lunch_style: 'leftovers', time_weeknight: 30,
    nutrition_goals: ['balanced','protein'], plan_source: 'both', cuisine_roots: 'Indian'
  };
  showApp(); updateHeaderUser(); renderProfileScreen(); renderFilterChips();
  loadRecipes(); loadMealPlan(); loadGroceries();
}

function initAuth() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('[auth] DEV bypass — skipping login');
    _devBypass();
    return;
  }
  db.auth.onAuthStateChange(async (event, session) => {
    console.log('[auth]', event, session?.user?.email || 'no user');
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      if (session?.user) {
        await onSignedIn(session.user);
      } else if (!currentUser) {
        showLoginOverlay();
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      userProfile = null;
      recipes     = [];
      mealPlan    = {};
      groceries   = [];
      showLoginOverlay();
    }
  });
}

async function onSignedIn(user) {
  if (currentUser?.id === user.id) return;
  currentUser = user;
  identifyUser(user.id, {email: user.email});
  localStorage.setItem('rv_has_logged_in', '1');
  try {
    const profile = await Promise.race([
      loadProfile(user.id),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    if (!profile) {
      showSetupOverlay();
    } else {
      userProfile = profile;
      showApp();
      restoreActiveTab();
      updateHeaderUser();
      renderProfileScreen();
      renderFilterChips();
      await loadRecipes();
      await loadMealPlan();
      await loadGroceries();
    }
  } catch(e) {
    if (e.message === 'timeout') {
      showLoginOverlay();
      showError('Connection timed out — please refresh to try again.');
    } else {
      console.error('Error loading app after sign-in:', e);
      showError('Something went wrong loading your data. Please refresh.');
    }
  }
}
