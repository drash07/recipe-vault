'use strict';

function showRecipeDetail(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  trackEvent('recipe_viewed', {id: r.id, name: r.name, source: r.source});

  const ings  = (r.ingredients && r.ingredients.length)
    ? '<div class="section-label">Ingredients</div><div style="font-size:13px;line-height:1.9">' + r.ingredients.map(i => '• ' + i).join('<br/>') + '</div>'
    : '';
  const steps = (r.steps && r.steps.length)
    ? '<div class="section-label">Steps</div>' + r.steps.map((s,i) =>
        '<div class="step-item"><div class="step-num">' + (i+1) + '</div><div class="step-text">' + s + '</div></div>'
      ).join('')
    : '';
  const srcLabel = { pinterest: r.board || '', instagram: r.board || '', ai: '✨ AI suggested', default: '📖 Starter recipe', manual: '✏️ Added manually' };

  document.getElementById('recipe-detail-content').innerHTML =
    '<div style="display:flex;align-items:center;gap:11px;margin-bottom:14px">' +
      '<span style="font-size:40px">' + (r.emoji || '🍽') + '</span>' +
      '<div>' +
        '<div style="font-family:Playfair Display,serif;font-size:18px;font-weight:600">' + r.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">⏱ ' + r.time + ' mins · ' + r.type + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + (srcLabel[r.source] || '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">' + (r.tags || []).map(t => '<span class="recipe-tag">' + t + '</span>').join('') + '</div>' +
    ings + steps + '<div style="margin-top:14px"></div>';

  document.getElementById('recipe-detail-modal').classList.add('open');
}
