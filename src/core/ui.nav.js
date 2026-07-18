'use strict';

function navigate(screen, el) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  el.classList.add('active');
  localStorage.setItem('rv_active_screen', screen);
  trackEvent('tab_viewed', {tab: screen});
  if (screen === 'recipes') { renderFilterChips(); renderRecipes(); }
  if (screen === 'grocery') loadGroceries();
  if (screen === 'profile') renderProfileScreen();
}

function switchHomeTab(tab, el) {
  document.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('home-plan').style.display      = tab === 'plan'      ? 'block' : 'none';
  document.getElementById('home-nutrition').style.display = tab === 'nutrition' ? 'block' : 'none';
  document.getElementById('home-prep').style.display      = tab === 'prep'      ? 'block' : 'none';
  if (tab === 'nutrition') {
    const cached = localStorage.getItem('rv_nut_' + getWeekStart());
    if (cached) { try { renderNutrition(JSON.parse(cached)); document.getElementById('nut-btn').textContent = '🔄 Refresh'; } catch(e) {} }
  }
  if (tab === 'prep') {
    const cached = localStorage.getItem('rv_prep_' + getWeekStart());
    if (cached) { try { document.getElementById('prep-timeline-content').innerHTML = renderPrepHtml(JSON.parse(cached)); document.getElementById('prep-btn').textContent = '🔄 Regenerate'; } catch(e) {} }
  }
}

function restoreActiveTab() {
  const s = localStorage.getItem('rv_active_screen');
  if (s && s !== 'home') {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const screen = document.getElementById('screen-' + s);
    const nav    = document.querySelector('.nav-item[onclick*="\'' + s + '\'"]');
    if (screen) screen.classList.add('active');
    if (nav)    nav.classList.add('active');
  }
}
