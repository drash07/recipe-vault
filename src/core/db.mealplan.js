'use strict';

async function loadMealPlan() {
  const week = getWeekStart();
  const { data, error } = await db.from('meal_plan').select('*')
    .eq('week_start', week).eq('user_id', currentUser.id);
  if (error) { showError('Could not load meal plan: ' + error.message); return; }
  mealPlan = {};
  (data || []).forEach(row => {
    if (!mealPlan[row.day_index]) mealPlan[row.day_index] = {};
    mealPlan[row.day_index][row.meal_type] = row.recipe_data;
  });
  renderWeekGrid();
  renderMealSlots();
}

async function saveMealSlot(dayIdx, mealType, recipe) {
  const week     = getWeekStart();
  const recipeId = (recipe && Number.isInteger(recipe.id) && recipe.id < 100000) ? recipe.id : null;
  const { error } = await db.from('meal_plan').upsert(
    { user_id: currentUser.id, day_index: dayIdx, meal_type: mealType,
      recipe_id: recipeId, recipe_data: recipe, week_start: week },
    { onConflict: 'user_id,day_index,meal_type,week_start' }
  );
  if (error) showError('Could not save meal: ' + error.message);
}
