'use strict';

function _sweetenerTag(r) {
  const p = userProfile || {};
  if (p.sweet_pref !== 'alternatives') return '';
  const ings = (r.ingredients || []).join(' ').toLowerCase();
  const userSweeteners = (p.sweeteners || []).filter(s => s !== 'any');

  const altPatterns = {
    jaggery: { re: /\b(jaggery|jaggery powder|gur)\b/,  label: 'Jaggery' },
    honey:   { re: /\bhoney\b/,                          label: 'Honey'   },
    dates:   { re: /\b(dates?|date syrup|medjool)\b/,    label: 'Dates'   },
    maple:   { re: /\bmaple\b/,                           label: 'Maple'   },
  };

  for (const key of userSweeteners) {
    if (altPatterns[key] && altPatterns[key].re.test(ings)) {
      return '<span class="recipe-tag" style="background:#FFF3E0;color:#E65100">🍯 ' + altPatterns[key].label + '</span>';
    }
  }

  if (/\b(sugar|white sugar|caster sugar|icing sugar|granulated sugar)\b/.test(ings)) {
    const subs = userSweeteners.map(k => altPatterns[k]?.label).filter(Boolean);
    if (subs.length) {
      return '<span class="recipe-tag" style="background:#FEF9E7;color:#9C6E03">🔄 Sub: ' + subs.join(' / ') + '</span>';
    }
  }

  return '';
}
