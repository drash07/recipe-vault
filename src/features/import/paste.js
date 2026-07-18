'use strict';

// ── TEXT PARSER ───────────────────────────────────────────────────
function parseRecipeText(text) {
  const clean      = s => s.replace(/[^\x00-\x7FÀ-ɏ]/g, '').replace(/\s+/g, ' ').trim();
  const toTitle    = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
  const stripBullet= s => s.replace(/^[-•*✅▢☐✓]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
  const isNoise    = s => !s || /^#\S|^@\S|^https?:\/\/|^www\./i.test(s.trim());
  const cleanIng   = s => clean(s).replace(/\s*(for serving|to serve|for garnish|as needed)\s*$/i, '').trim();

  const ingM  = text.match(/ingredients?\s*:?/i);
  const stepM = text.match(/steps?\s*:|instructions?\s*:|method\s*:|directions?\s*:/i);

  let title = '', ingredients = [], steps = [];

  if (ingM) {
    const beforeIng = text.slice(0, ingM.index).split('\n').map(l => clean(l)).filter(l => l && !isNoise(l));
    title = toTitle(beforeIng[0] || '').replace(/!+$/, '').trim();
    const ingStart  = ingM.index + ingM[0].length;
    const ingEnd    = stepM ? stepM.index : text.length;
    const ingRaw    = text.slice(ingStart, ingEnd).replace(/^[\s:]+/, '').trim();
    const byLine    = ingRaw.split('\n').map(l => cleanIng(stripBullet(l))).filter(l => l.length > 1 && !isNoise(l));
    ingredients     = byLine.length > 1 ? byLine : ingRaw.split(',').map(l => cleanIng(stripBullet(l))).filter(l => l.length > 1);
    if (stepM) {
      const stepRaw   = text.slice(stepM.index + stepM[0].length).replace(/^[\s:]+/, '').trim();
      const byStepLine= stepRaw.split('\n').map(l => clean(stripBullet(l)).replace(/^tip\s*[:\-–]?\s*/i, '')).filter(l => l.length > 5 && !isNoise(l));
      steps = byStepLine.length > 1 ? byStepLine : stepRaw.split('•').map(l => clean(stripBullet(l)).replace(/^tip\s*[:\-–]?\s*/i, '')).filter(l => l.length > 5);
    }
  } else {
    const lines     = text.split('\n').map(l => clean(l)).filter(l => l && !isNoise(l));
    title           = toTitle(lines[0] || '').replace(/!+$/, '').trim();
    const firstStep = lines.findIndex((l, i) => i > 0 && /^1[.)]\s/.test(l));
    if (firstStep > 0) {
      ingredients = lines.slice(1, firstStep).map(stripBullet);
      steps       = lines.slice(firstStep).map(l => stripBullet(l).replace(/^tip\s*[:\-–]?\s*/i, ''));
    } else {
      ingredients = lines.slice(1).map(stripBullet);
    }
  }

  return { title, ingredients: ingredients.filter(Boolean), steps: steps.filter(Boolean) };
}

// ── PASTE FORM ────────────────────────────────────────────────────
function parseAndShowForm() {
  const text = document.getElementById('paste-import-input').value.trim();
  if (text.length < 10) { showError('Paste some recipe text first.'); return; }
  const p = parseRecipeText(text);
  document.getElementById('paste-name').value        = p.title;
  document.getElementById('paste-ingredients').value = p.ingredients.join('\n');
  document.getElementById('paste-steps').value       = p.steps.join('\n');
  document.getElementById('paste-time').value        = '';
  document.getElementById('paste-step-1').style.display = 'none';
  document.getElementById('paste-step-2').style.display = 'block';
}

function resetPasteForm() {
  document.getElementById('paste-step-1').style.display = 'block';
  document.getElementById('paste-step-2').style.display = 'none';
}

async function savePastedRecipe() {
  const name        = document.getElementById('paste-name').value.trim();
  const ingredients = document.getElementById('paste-ingredients').value.trim().split('\n').map(l=>l.trim()).filter(Boolean);
  const steps       = document.getElementById('paste-steps').value.trim().split('\n').map(l=>l.trim()).filter(Boolean);
  if (!name)              { showError('Recipe name is required.');        return; }
  if (!ingredients.length){ showError('Add at least one ingredient.');    return; }
  if (!steps.length)      { showError('Add at least one step.');          return; }

  const catVal  = document.getElementById('paste-type').value;
  const boardMap= { Soup:{ type:'Snack', board:'Soups' }, Sauce:{ type:'Snack', board:'Sauce & Chutneys' }, Dip:{ type:'Snack', board:'Dips & Dressings' } };
  const { type, board } = boardMap[catVal] || { type: catVal, board: null };
  const emojiMap= { Dinner:'🌙', Breakfast:'🌅', Snack:'🍿', Dessert:'🍮', Salad:'🥗', Soup:'🍲', Sauce:'🌿', Dip:'🫙' };
  const shared  = document.getElementById('paste-shared')?.checked || false;

  const recipe = {
    id: Date.now(), name, type, board,
    time:  parseInt(document.getElementById('paste-time').value) || 30,
    emoji: emojiMap[catVal] || '🍽',
    ingredients, steps, tags: [], source: 'manual', shared
  };

  const ok = await upsertRecipe(recipe);
  if (ok) {
    recipes.push({ ...recipe, user_id: currentUser.id });
    showStatus('Recipe saved!');
    setTimeout(hideStatus, 2000);
    document.getElementById('paste-import-input').value = '';
    resetPasteForm();
    if (document.getElementById('paste-shared')) document.getElementById('paste-shared').checked = false;
  } else {
    showError('Could not save recipe. Try again.');
  }
}
