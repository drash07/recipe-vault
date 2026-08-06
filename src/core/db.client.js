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
    const isUndefined = typeof window.supabase === 'undefined';
    document.getElementById('login-error').textContent = isUndefined
      ? 'ERR: script not loaded'
      : ('ERR: ' + e.message);
    return false;
  }
}
