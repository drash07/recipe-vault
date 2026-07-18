'use strict';

function _setIgState(state) {
  ['login','collections','importing','result'].forEach(s => {
    const el = document.getElementById('ig-state-' + s);
    if (el) el.style.display = s === state ? '' : 'none';
  });
}

async function openIgImport() {
  trackEvent('instagram_import_attempted');
  document.getElementById('ig-import-modal').classList.add('open');
  _setIgState('login');
  document.getElementById('ig-login-error').textContent = '';
  try {
    const res  = await fetch(API_BASE + '/api/ig/status');
    const data = await res.json();
    if (data.connected) {
      document.getElementById('ig-connected-name').textContent = '@' + data.username;
      _setIgState('collections');
      _igLoadCollections();
    }
  } catch (_) {}
}

async function igConnectNative() {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const { Browser }          = await import('@capacitor/browser');
    const { CapacitorCookies } = await import('@capacitor/core');
    await Browser.open({ url: 'https://www.instagram.com/accounts/login/' });
    Browser.addListener('browserPageLoaded', async () => {
      try {
        const cookies = await CapacitorCookies.getCookies({ url: 'https://www.instagram.com' });
        if (cookies && cookies['sessionid']) { await Browser.close(); await _igSubmitSession(cookies['sessionid']); }
      } catch (_) {}
    });
  } else {
    document.getElementById('ig-web-fallback').style.display  = '';
    document.getElementById('ig-native-btn').style.display    = 'none';
  }
}

async function _igSubmitSession(sessionId) {
  document.getElementById('ig-login-error').textContent  = '';
  document.getElementById('ig-native-btn').disabled      = true;
  document.getElementById('ig-native-btn').textContent   = 'Connecting…';
  try {
    const res  = await fetch(API_BASE + '/api/ig/session', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('ig-connected-name').textContent = '@' + data.username;
      _setIgState('collections');
      _igLoadCollections();
    } else {
      document.getElementById('ig-login-error').textContent = data.error || 'Connection failed. Try again.';
    }
  } catch (e) {
    document.getElementById('ig-login-error').textContent = 'Server error — is server.py running?';
  }
  const btn = document.getElementById('ig-native-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Open Instagram to log in'; }
}

async function igSubmitSessionId() {
  const val = document.getElementById('ig-session-input').value.trim();
  if (!val) { document.getElementById('ig-login-error').textContent = 'Paste your session ID first.'; return; }
  await _igSubmitSession(val);
}

async function igSubmitLogin() {
  const u = document.getElementById('ig-username').value.trim();
  const p = document.getElementById('ig-password').value.trim();
  if (!u || !p) { document.getElementById('ig-login-error').textContent = 'Fill in both fields.'; return; }
  const btn = document.getElementById('ig-login-btn');
  btn.disabled = true; btn.textContent = 'Connecting…';
  try {
    const res  = await fetch(API_BASE + '/api/ig/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('ig-connected-name').textContent = '@' + data.username;
      _setIgState('collections');
      _igLoadCollections();
    } else {
      document.getElementById('ig-login-error').textContent = data.error || 'Login failed.';
    }
  } catch (e) {
    document.getElementById('ig-login-error').textContent = 'Server error — is server.py running?';
  }
  btn.disabled = false; btn.textContent = 'Connect';
}

async function _igLoadCollections() {
  const grid = document.getElementById('ig-collections-grid');
  grid.innerHTML = '<div style="text-align:center;padding:20px;font-size:12px;color:var(--text-muted)"><span class="spinner"></span> Loading folders…</div>';
  try {
    const res  = await fetch(API_BASE + '/api/ig/collections');
    const data = await res.json();
    if (data.error) { grid.innerHTML = '<div style="color:#C0392B;font-size:12px">' + data.error + '</div>'; return; }
    grid.innerHTML = data.collections.map(c => {
      const disabled = c.count === 0;
      return `<div class="ig-folder-card${disabled ? ' ig-folder-disabled' : ''}"
        ${disabled ? '' : `onclick="igSelectCollection('${c.id}','${c.name.replace(/'/g,"\\'")}')"`}>
        <div style="font-size:22px;margin-bottom:5px">📁</div>
        <div style="font-size:12px;font-weight:500;margin-bottom:2px">${c.name}</div>
        <div style="font-size:10px;color:var(--text-muted)">${disabled ? 'Empty' : c.count + ' posts'}</div>
      </div>`;
    }).join('');
  } catch (_) {
    grid.innerHTML = '<div style="color:#C0392B;font-size:12px">Could not load folders. Check server.</div>';
  }
}

async function igSelectCollection(collectionId, collectionName) {
  _setIgState('importing');
  document.getElementById('ig-importing-text').textContent      = 'Scanning "' + collectionName + '"…';
  document.getElementById('ig-collections-error').style.display = 'none';
  try {
    const { data: { session } } = await db.auth.getSession();
    const token  = session?.access_token || '';
    const userId = currentUser?.id || '';
    const res    = await fetch(API_BASE + '/api/ig/import', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ collection_id: collectionId, collection_name: collectionName, token, user_id: userId })
    });
    const data = await res.json();
    if (data.error)      { _igShowCollectionError(data.error, collectionName); return; }
    if (data.no_recipes) { _igShowCollectionError('No recipes found in "' + collectionName + '"', collectionName); return; }

    _setIgState('result');
    let html = data.imported > 0
      ? `<div style="font-size:32px;margin-bottom:8px">🎉</div><div style="font-size:15px;font-weight:600;margin-bottom:12px">Import complete!</div>`
      : `<div style="font-size:32px;margin-bottom:8px">ℹ️</div><div style="font-size:15px;font-weight:600;margin-bottom:12px">Nothing new to add</div>`;
    html += `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">`;
    if (data.imported        > 0) html += `<span class="chip-green">✅ ${data.imported} added</span>`;
    if (data.skipped_dupe    > 0) html += `<span class="chip-yellow">⏭️ ${data.skipped_dupe} already in vault</span>`;
    if (data.skipped_no_recipe>0) html += `<span class="chip">🚫 ${data.skipped_no_recipe} not recipes</span>`;
    html += `</div>`;
    document.getElementById('ig-result-content').innerHTML = html;
    if (data.imported > 0) await loadRecipes();
  } catch (e) {
    _igShowCollectionError('Something went wrong — ' + e.message, collectionName);
  }
}

function _igShowCollectionError(message, collectionName) {
  _setIgState('collections');
  const err = document.getElementById('ig-collections-error');
  err.textContent    = message;
  err.style.display  = '';
}

function igRetryFolder()    { document.getElementById('ig-collections-error').style.display='none'; _igLoadCollections(); }
function igImportAnother()  { _setIgState('collections'); document.getElementById('ig-collections-error').style.display='none'; _igLoadCollections(); }
function igDisconnect() {
  fetch(API_BASE + '/api/ig/session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id:'' }) }).catch(()=>{});
  _setIgState('login');
  document.getElementById('ig-login-error').textContent   = '';
  document.getElementById('ig-native-btn').style.display  = '';
  document.getElementById('ig-web-fallback').style.display= 'none';
}
