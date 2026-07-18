'use strict';

let recipeView = 'mine';

function renderFilterChips() {
  const mt      = userProfile?.meal_types || ['breakfast','dinner','snack'];
  const noSweets= userProfile?.sweet_pref === 'none';
  const chips   = [{ f:'all', label:'All' }];

  if (mt.includes('breakfast')) chips.push({ f:'Breakfast', label:'🌅 Breakfast' });
  if (mt.includes('dinner'))    chips.push({ f:'Dinner',    label:'🌙 Dinner / Lunch' });
  if (mt.includes('snack'))     chips.push({ f:'Snack',     label:'🍿 Snacks' });
  if (!noSweets)                chips.push({ f:'Dessert',   label:'🍮 Desserts' });
  chips.push({ f:'Salad', label:'🥗 Salads' });
  chips.push({ f:'Soup',  label:'🍲 Soups' });
  chips.push({ f:'Sauce', label:'🌿 Sauces & Chutneys' });
  chips.push({ f:'Dip',   label:'🫙 Dips & Dressings' });

  document.getElementById('filter-bar').innerHTML = chips.map(c =>
    '<button class="filter-chip' + (activeFilter === c.f ? ' active' : '') + '" onclick="setFilter(\'' + c.f + '\',this)">' + c.label + '</button>'
  ).join('');
}

function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderRecipes(searchQuery);
}

function filterRecipes(q) { searchQuery = q; renderRecipes(q); }

function switchRecipeView(view, el) {
  recipeView = view;
  document.querySelectorAll('.recipe-view-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderFilterChips();
  renderRecipes(searchQuery);
}

function renderRecipes(q) {
  q = q || '';
  const list  = document.getElementById('recipes-list');
  const mine  = recipes.filter(r => r.user_id === currentUser?.id);
  const vault = recipes.filter(r => r.shared);
  let pool    = recipeView === 'vault' ? vault : mine;

  if (recipeView === 'vault') pool = pool.filter(_matchesPreferences);
  if (q) pool = pool.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase()))
  );

  if      (activeFilter === 'Dinner')    pool = pool.filter(r => r.type === 'Dinner'   || r.type === 'Both');
  else if (activeFilter === 'Breakfast') pool = pool.filter(r => r.type === 'Breakfast' || r.type === 'Both');
  else if (activeFilter === 'Snack')     pool = pool.filter(r => r.type === 'Snack');
  else if (activeFilter === 'Dessert')   pool = pool.filter(r => r.type === 'Dessert');
  else if (activeFilter === 'Salad')     pool = pool.filter(r => r.type === 'Salad');
  else if (activeFilter === 'Soup')      pool = pool.filter(r => r.board === 'Soups');
  else if (activeFilter === 'Sauce')     pool = pool.filter(r => r.board === 'Sauce & Chutneys');
  else if (activeFilter === 'Dip')       pool = pool.filter(r => r.board === 'Dips & Dressings');

  document.getElementById('recipe-count').textContent = (recipeView === 'vault' ? vault : mine).length;
  const times = pool.map(r => r.time).filter(Boolean);
  document.getElementById('avg-time').textContent = times.length
    ? Math.round(times.reduce((a,b) => a+b,0) / times.length) + 'm' : '—';

  if (!pool.length) {
    list.innerHTML = '<div style="text-align:center;padding:28px 14px;color:var(--text-muted);font-size:13px">' +
      (recipeView === 'vault'
        ? '🔍 No vault recipes match your preferences and filters.'
        : '📭 No recipes yet. Add one via <strong>Paste a Recipe</strong> in the Profile tab.') +
    '</div>';
    return;
  }

  list.innerHTML = pool.map(r => recipeCardHtml(r, 'showRecipeDetail(' + r.id + ')', { extraClass: 'fade-in' })).join('');
}
