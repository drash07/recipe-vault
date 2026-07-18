'use strict';

async function loadRecipes() {
  showStatus('Loading your recipes...');
  const { data, error } = await db.from('recipes').select('*');
  if (error) { showError('Could not load recipes: ' + error.message); hideStatus(); return; }
  recipes = data || [];
  renderRecipes();
  hideStatus();
}

async function upsertRecipe(recipe) {
  const payload = { ...recipe, user_id: currentUser.id };
  const { error } = await db.from('recipes').upsert(payload);
  if (error) { showError('Could not save recipe: ' + error.message); return false; }
  return true;
}
