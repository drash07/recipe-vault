'use strict';

async function loadGroceries() {
  const week = getWeekStart();
  const { data, error } = await db.from('groceries').select('*')
    .eq('week_start', week).eq('user_id', currentUser.id);
  if (error) { showError('Could not load grocery list: ' + error.message); return; }
  groceries = data || [];
  renderGrocery();
}

async function persistGroceries() {
  const week = getWeekStart();
  await db.from('groceries').delete().eq('week_start', week).eq('user_id', currentUser.id);
  if (groceries.length > 0) {
    const rows = groceries.map(g => ({
      name: g.name, checked: g.checked, count: g.count,
      week_start: week, user_id: currentUser.id
    }));
    const { error } = await db.from('groceries').insert(rows);
    if (error) { showError('Could not save grocery list: ' + error.message); return; }
    await loadGroceries();
  } else {
    renderGrocery();
  }
}
