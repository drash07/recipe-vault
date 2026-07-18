'use strict';

// ── AI CALL ───────────────────────────────────────────────────────
async function callAI(prompt, maxTokens) {
  const res  = await fetch(API_BASE + '/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: maxTokens || 1200 })
  });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error);
    if (res.status === 429 || data.error.toLowerCase().includes('rate') || data.error.toLowerCase().includes('overloaded')) err.isRateLimit = true;
    throw err;
  }
  return data.text;
}

function parseAIJson(text) {
  try { return JSON.parse(text); } catch(_) {}
  const s = text.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
  try { return JSON.parse(s); } catch(_) {}
  const m = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (m) { try { return JSON.parse(m[1]); } catch(_) {} }
  throw new Error('Could not parse AI response as JSON');
}

// ── PROFILE STRING (shared across all AI prompts) ─────────────────
function buildProfileString(p) {
  if (!p) return 'vegetarian, eggs OK, no refined sugar (jaggery OK), Indian-rooted, under 30 mins';
  const parts = [];
  const dietMap = { vegetarian:'vegetarian', vegan:'vegan', flexible:'mostly vegetarian' };
  parts.push(dietMap[p.dietary_type] || 'vegetarian');
  if (p.dietary_type !== 'vegan' && p.eggs_ok) parts.push('eggs OK');
  if (p.sweet_pref === 'alternatives') {
    const sw = (p.sweeteners || ['jaggery']).filter(s => s !== 'any').join('/');
    parts.push('no refined sugar' + (sw ? ' (' + sw + ' OK)' : ''));
  } else if (p.sweet_pref === 'none') {
    parts.push('no sweets');
  }
  const allergies = (p.allergies || []).filter(a => a !== 'none');
  if (allergies.length) parts.push('no ' + allergies.join(', '));
  if (p.cuisine_roots) parts.push(p.cuisine_roots + '-rooted cooking');
  parts.push('under ' + (p.time_weeknight || 30) + ' mins on weeknights');
  const goalMap = { balanced:'balanced nutrition', protein:'high protein', fibre:'high fibre', heart:'heart healthy', energy:'high energy', light:'light and low-calorie', calcium:'calcium-rich' };
  const goals = (p.nutrition_goals || []).map(g => goalMap[g] || g);
  if (goals.length) parts.push('nutrition goals: ' + goals.join(', '));
  return parts.join(', ');
}
