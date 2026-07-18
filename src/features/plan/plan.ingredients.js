'use strict';

function openIngredientsModal() {
  document.getElementById('ing-input').value     = '';
  document.getElementById('ing-results').innerHTML= '';
  document.getElementById('gen-recipe-btn').innerHTML = '✨ Generate recipe';
  document.getElementById('gen-recipe-btn').disabled  = false;
  document.getElementById('ingredients-modal').classList.add('open');
}

function clearIngResults() { document.getElementById('ing-results').innerHTML = ''; }

function findByIngredients() {
  const input = document.getElementById('ing-input').value;
  if (!input.trim()) { showError('Enter at least one ingredient'); return; }
  const terms  = input.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const scored = recipes.map(r => {
    const ingText = (r.ingredients||[]).join(' ').toLowerCase();
    const matched = terms.filter(t => ingText.includes(t));
    return { r, count:matched.length, matched };
  }).filter(x => x.count > 0).sort((a,b) => b.count - a.count);

  if (!scored.length) {
    document.getElementById('ing-results').innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:14px">No vault recipes match those ingredients.<br>Try <em>Generate recipe</em> to create a new one!</div>';
    return;
  }
  let html = '<div class="section-label">' + scored.length + ' recipe' + (scored.length>1?'s':'') + ' in your vault</div>';
  scored.forEach(({r,matched}) => {
    html += '<div class="recipe-card" onclick="showRecipeDetail(' + r.id + ')"><div class="recipe-emoji">' + (r.emoji||'🍽') + '</div><div class="recipe-info"><div class="recipe-name">' + r.name + '</div><div class="recipe-meta-row"><span>⏱ ' + r.time + 'm</span></div><div class="recipe-tags">' + matched.map(t => '<span class="recipe-tag green">✓ ' + t + '</span>').join('') + '</div></div></div>';
  });
  document.getElementById('ing-results').innerHTML = html;
}

async function generateRecipeFromIngredients() {
  const input = document.getElementById('ing-input').value;
  if (!input.trim()) { showError('Enter at least one ingredient first'); return; }
  const btn   = document.getElementById('gen-recipe-btn');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled  = true;
  const prompt  = 'Create a recipe for a home cook with this profile: ' + buildProfileString(userProfile) + '. Use these ingredients: ' + input + '. Return ONLY JSON: {"name":"...","time":25,"type":"Dinner","emoji":"🍛","tags":["tag1"],"ingredients":["qty ingredient"],"steps":["Step 1"]}. type must be one of: Dinner, Breakfast, Snack, Dessert, Salad, Both.';
  try {
    const data = parseAIJson(await callAI(prompt, 900));
    _generatedRecipe = data;
    let html = '<div style="background:var(--leaf-light);border:1px solid var(--leaf);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px">' +
      '<div style="font-size:16px;font-weight:500;margin-bottom:4px">' + (data.emoji||'🍽') + ' ' + data.name + '</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">⏱ ' + data.time + ' mins · ' + data.type + '</div>' +
      '<div style="font-size:11px;font-weight:600;margin-bottom:3px">Ingredients</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">' + (data.ingredients||[]).join(', ') + '</div>' +
      '<div style="font-size:11px;font-weight:600;margin-bottom:3px">Steps</div>' +
      (data.steps||[]).map((s,i) => '<div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">' + (i+1) + '. ' + s + '</div>').join('') +
      '</div><button class="btn btn-leaf btn-full" onclick="saveGeneratedRecipe()">💾 Save to my recipes</button>';
    document.getElementById('ing-results').innerHTML = html;
  } catch(e) { showError('AI unavailable — showing vault matches instead'); findByIngredients(); }
  btn.innerHTML = '✨ Generate recipe';
  btn.disabled  = false;
}

async function saveGeneratedRecipe() {
  if (!_generatedRecipe) return;
  const recipe = {
    id: Date.now(), name: _generatedRecipe.name,
    time: parseInt(_generatedRecipe.time)||30, type: _generatedRecipe.type||'Dinner',
    emoji: _generatedRecipe.emoji||'🍽', tags: _generatedRecipe.tags||[],
    ingredients: _generatedRecipe.ingredients||[], steps: _generatedRecipe.steps||[],
    source: 'ai', board: null, shared: false
  };
  const ok = await upsertRecipe(recipe);
  if (ok) {
    recipes.push({ ...recipe, user_id: currentUser.id });
    renderRecipes();
    showStatus('Recipe saved to your vault!');
    closeModal('ingredients-modal');
    _generatedRecipe = null;
  }
}
