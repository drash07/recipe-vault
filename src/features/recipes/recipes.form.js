'use strict';

function openAddModal() {
  document.getElementById('add-modal').classList.add('open');
}

async function saveNewRecipe() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) return;
  const steps  = document.getElementById('new-steps').value.split('\n').map(s => s.trim()).filter(Boolean);
  const shared = document.getElementById('new-shared')?.checked || false;
  const recipe = {
    id:          Date.now(),
    name,
    time:        parseInt(document.getElementById('new-time').value) || 30,
    type:        document.getElementById('new-type').value,
    emoji:       '🍽',
    ingredients: document.getElementById('new-ingredients').value.split(',').map(s => s.trim()).filter(Boolean),
    steps, tags: [], source: 'manual', board: null, shared
  };
  const ok = await upsertRecipe(recipe);
  if (ok) {
    recipes.push({ ...recipe, user_id: currentUser.id });
    closeModal('add-modal');
    renderRecipes();
    document.getElementById('new-name').value        = '';
    document.getElementById('new-time').value        = '';
    document.getElementById('new-ingredients').value = '';
    document.getElementById('new-steps').value       = '';
    if (document.getElementById('new-shared')) document.getElementById('new-shared').checked = false;
  }
}
