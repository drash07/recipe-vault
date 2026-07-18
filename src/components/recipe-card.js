'use strict';

// Returns the HTML string for a recipe card.
// onclick: the JS expression to execute on click
// opts.extraClass: additional CSS class on the card div
// opts.showBadge: whether to show source badge (default true)
// opts.showSweetener: whether to show sweetener tag (default true)
// opts.maxTags: max number of tags to show (default 3)
function recipeCardHtml(r, onclick, opts) {
  opts = opts || {};
  const extraClass     = opts.extraClass    || '';
  const showBadge      = opts.showBadge     !== false;
  const showSweetener  = opts.showSweetener !== false;
  const maxTags        = opts.maxTags       || 3;

  return '<div class="recipe-card' + (extraClass ? ' ' + extraClass : '') + '" onclick="' + onclick + '">' +
    '<div class="recipe-emoji">' + (r.emoji || '🍽') + '</div>' +
    '<div class="recipe-info">' +
      '<div class="recipe-name">' + r.name + '</div>' +
      '<div class="recipe-meta-row"><span>⏱ ' + r.time + 'm</span><span>·</span><span>' + r.type + '</span>' +
        (showBadge ? (_srcBadge[r.source] || '') : '') +
      '</div>' +
      '<div class="recipe-tags">' +
        (r.tags || []).slice(0, maxTags).map(t => '<span class="recipe-tag">' + t + '</span>').join('') +
        (r.board ? '<span class="recipe-tag pink">' + r.board + '</span>' : '') +
        (showSweetener ? _sweetenerTag(r) : '') +
      '</div>' +
    '</div>' +
  '</div>';
}
