'use strict';

async function generateGrocery() {
  const mealTypes  = userProfile?.meal_types || ['breakfast','dinner'];
  const lunchStyle = userProfile?.lunch_style || 'leftovers';
  const all        = {};

  Object.values(mealPlan).forEach(day => {
    mealTypes.forEach(m => {
      if (m === 'lunch' && lunchStyle === 'leftovers') return;
      const meal       = day && day[m];
      if (!meal || !meal.ingredients || meal.source === 'outside') return;
      const multiplier = (m === 'dinner' && lunchStyle === 'leftovers') ? 2 : 1;
      meal.ingredients.forEach(raw => {
        splitCompound(raw).forEach(part => {
          const key = ingKey(part);
          const qty = ingQty(part);
          if (key.length < 2) return;
          if (all[key]) {
            all[key].count += multiplier;
            if (qty) all[key].qtys.push(qty);
          } else {
            all[key] = { name: key.replace(/\b\w/g,c=>c.toUpperCase()), checked:false, count:multiplier, qtys:qty?[qty]:[] };
          }
        });
      });
    });
  });

  fuzzyDedup(all);
  Object.values(all).forEach(item => {
    item.category   = getCategory(item.name.toLowerCase());
    item.qtyDisplay = sumQtys(item.qtys);
  });
  groceries = Object.values(all);
  trackEvent('grocery_list_generated', {count: groceries.length});
  await persistGroceries();
}
