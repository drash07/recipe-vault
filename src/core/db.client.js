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
    showError('Could not connect to database.');
    return false;
  }
}
