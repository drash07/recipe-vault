'use strict';

function _matchesPreferences(r) {
  const p    = userProfile || {};
  const ings = (r.ingredients || []).join(' ').toLowerCase();

  if (p.dietary_type === 'vegan') {
    if (/\b(paneer|cheese|milk|cream|butter|ghee|yogurt|curd|egg|eggs|meat|chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|seafood|bacon|turkey|tuna|salmon|keema)\b/.test(ings)) return false;
  }
  if (p.dietary_type === 'vegetarian') {
    if (/\b(meat|chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|seafood|bacon|turkey|tuna|salmon|keema)\b/.test(ings)) return false;
  }
  if (p.dietary_type !== 'vegan' && p.eggs_ok === false) {
    if (/\b(egg|eggs)\b/.test(ings)) return false;
  }

  const allergies = (p.allergies || []).filter(a => a !== 'none');
  for (const a of allergies) {
    if (a === 'nuts'   && /\b(almond|cashew|pistachio|walnut|pecan|hazelnut)\b/.test(ings))      return false;
    if (a === 'dairy'  && /\b(paneer|cheese|milk|cream|butter|ghee|yogurt|curd)\b/.test(ings))   return false;
    if (a === 'gluten' && /\b(flour|bread|pasta|wheat|roti|noodle|tortilla)\b/.test(ings))        return false;
    if (a === 'soy'    && /\b(soy|tofu|edamame)\b/.test(ings))                                    return false;
    if (a === 'peanuts'&& /\bpeanut\b/.test(ings))                                                return false;
    if (a === 'sesame' && /\b(sesame|tahini)\b/.test(ings))                                       return false;
  }

  if (p.sweet_pref === 'none' && r.type === 'Dessert') return false;

  const maxTime = (p.time_weeknight || 60) + 30;
  if (r.time && r.time > maxTime) return false;

  return true;
}
