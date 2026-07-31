'use strict';

function initDB() {
  try {
    db = window.supabase.createClient(SURL, SKEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    });
    return true;
  } catch(e) {
    console.error('initDB failed:', e);
    document.getElementById('login-error').textContent = 'Could not connect — please refresh.';
    return false;
  }
}
