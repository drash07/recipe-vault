# Recipe Vault – Project Notes
**User:** Drashti | **Date:** May 30, 2026

---

## What This App Is
A personal meal planning web app built as a single HTML file (`recipe-vault.html`). It uses:
- **Supabase** for cloud storage (recipes, meal plans, grocery lists)
- **Gemini API** (Google, free tier) for all AI features
- **Python server** (`server.py`) to serve the app and proxy Gemini API calls

---

## Files (all in `C:\Users\patel\Downloads\`)
| File | Purpose |
|------|---------|
| `recipe-vault.html` | The entire app — 112KB, all HTML/CSS/JS |
| `server.py` | Local Python server — serves app + proxies Gemini calls |

**To run:**
```powershell
cd C:\Users\patel\Downloads
python server.py
```
Then open **Chrome** at `http://localhost:8080`

---

## Credentials
| Service | Key/Value |
|---------|-----------|
| Supabase URL | stored as `SUPABASE_URL` GitHub repo secret |
| Supabase anon key | stored as `SUPABASE_KEY` GitHub repo secret |
| Gemini API key | stored as `GEMINI_KEY` GitHub repo secret |
| Gemini model | `gemini-2.0-flash` |

---

## What's Working ✅
- App loads at `http://localhost:8080`
- All **78 recipes** load from Supabase (with full ingredients + steps)
- **Week grid** with meal planning (tap day → plan breakfast/dinner)
- **Recipe browser** with filters: All / Dinner / Breakfast / Snacks / Desserts / Salads / Soups / Pinterest
- **Grocery list** auto-generated from meal plan
- **Supabase** saving meal plan and groceries
- **Server proxy** receiving Gemini requests and returning clean JSON
- **Gemini API** responding correctly (server prints `AI response: {...}`)

---

## What's Broken ❌

### AI Features — "Could not load suggestions / Could not generate plan"
**Root cause:** The server successfully gets JSON from Gemini and returns it with HTTP 200. But the JavaScript in the browser fails to parse it and shows the error message.

**Evidence:** Server log shows:
```
AI request: You are a smart meal planner...
AI response: { "plan": [ { "dayName": "Saturday"...
POST /api/ai HTTP/1.1 200
```
But UI shows: `"Could not generate plan. Check your connection."`

**Likely cause:** The `try/catch` block in the JS is catching a parsing error or a `parsed.plan` access error and showing the generic error message instead of the real error.

### Affected functions in `recipe-vault.html`:
1. `getSuggestions()` — "AI suggestions for this day" button
2. `analyseNutrition()` — Nutrition tab
3. `generatePrepTimeline()` — Prep tab
4. `generateSmartPlan()` — "Auto-plan my next 5 days" button
5. `importFromUrl()` — Profile tab URL import

---

## The Fix Needed

### In `recipe-vault.html` — find the `callAI` function:
```javascript
async function callAI(prompt, maxTokens) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: prompt, maxTokens: maxTokens || 1200 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}
```

**Add error logging so we can see what's actually failing.** Replace with:
```javascript
async function callAI(prompt, maxTokens) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: prompt, maxTokens: maxTokens || 1200 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  console.log('callAI raw response:', data.text.slice(0, 200));
  return data.text;
}
```

### Also in each catch block — replace generic error with console.error:
Find every catch block like:
```javascript
} catch(e) {
  document.getElementById('suggestions-content').innerHTML = `<div ...>Could not load...</div>`;
```

Add `console.error('AI error:', e);` before the innerHTML line so we can see the real error.

### In `server.py` — the Gemini response stripping:
Current code strips markdown but may have regex issues on Windows. Replace the stripping section with:
```python
import re, json as _json
text = resp["candidates"][0]["content"]["parts"][0]["text"]
# Strip markdown
text = re.sub(r'```json\s*', '', text)
text = re.sub(r'```\s*', '', text)
text = text.strip()
# Validate JSON
try:
    _json.loads(text)
except:
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if m:
        text = m.group(0)
print(f"  AI response (cleaned): {text[:100]}...")
self._json(200, {"text": text})
```

---

## App Architecture

### How AI calls flow:
```
Browser (recipe-vault.html)
  → callAI(prompt, maxTokens)
  → fetch('/api/ai', { body: { prompt, maxTokens } })
  → server.py do_POST('/api/ai')
  → Gemini API (generativelanguage.googleapis.com)
  → server strips markdown, validates JSON
  → returns { "text": "<json string>" }
  → browser parses JSON.parse(data.text)
  → renders result
```

### Supabase tables:
- `recipes` — all 78 recipes with ingredients, steps, tags
- `meal_plan` — weekly meal assignments (by day_index + meal_type + week_start)
- `groceries` — weekly grocery list (by week_start)

### localStorage key: `rv_recipes_v4` (fallback if Supabase fails)

---

## Recipe Sections (78 total)
| Section | Count | Board |
|---------|-------|-------|
| Default Indian staples | 8 | — |
| Main Course | 10 | Pinterest |
| Breakfast | 3 | Pinterest |
| Small Bites | 10 | Pinterest |
| Sweet Tooth | 13 | Pinterest |
| Salads | 8 | Pinterest |
| Dips & Dressings | 17 | Pinterest |
| Soups | 4 | Pinterest |
| Default extras | 5 | — |

---

## Drashti's Preferences
- **Diet:** Vegetarian, eggs OK, no meat at all
- **Sugar:** No refined sugar (jaggery/dates/honey OK)
- **Cuisine:** Indian-rooted but open to global vegetarian
- **Household:** Solo + partner sometimes, dog (Labrador)
- **Cooking:** Fresh daily, under 30 mins weeknights
- **Meals:** Breakfast + Dinner daily; Lunch = last night's leftovers
- **Wednesday:** Lunch skipped (eats at work)
- **Storage:** Supabase cloud (was localStorage before)

---

## UI Features Built
1. **Plan tab** — Week grid, tap day → plan meals, AI suggestions per day
2. **Auto-plan** — "🎲 Auto-plan my next 5 days" with 2 outside food days, swap meals
3. **Nutrition tab** — AI analyses week, shows protein/carbs/fat/calories
4. **Prep tab** — AI generates batch-cook timeline
5. **Recipes tab** — Search + filter chips, tap for full detail modal with steps
6. **Grocery tab** — Auto-generated from meal plan, checkable items
7. **Profile tab** — Preferences, URL import (AI reads any recipe URL), dog meal ideas

---

## Known Issues / TODO
- [ ] **FIX:** AI features show "Could not load" even when Gemini returns 200 OK
- [ ] Add Claude extension to Chrome (currently disconnected)
- [ ] Dips & Dressings filter chip not added to recipe filter bar
- [ ] Week grid day pills could be more evenly spaced on mobile
- [ ] GitHub Pages hosting (so app works on phone without local server)
- [ ] @dillifoodies Instagram recipes not yet added
- [ ] Salads filter chip in recipe browser
- [ ] Two unknown Pinterest sections never identified

---

## How to Debug the AI Issue
1. Open Chrome at `http://localhost:8080`
2. Press F12 → Console tab
3. Try "AI suggestions" button
4. Look for `callAI raw response:` log — tells you what the server returned
5. Look for `AI error:` log — tells you exactly what failed in parsing
6. The real error will be visible in console instead of the generic message

---

## Server startup output (correct):
```
=============================================
  Recipe Vault - Ready!
  Gemini: gemini-2.5-flash (free tier)
  Open: http://localhost:8080
  Ctrl+C to stop
=============================================
```

## Server log when AI works correctly:
```
  GET / HTTP/1.1 200
  AI request: You are a smart meal planner...
  AI response (cleaned): {"plan": [{"dayName"...
  POST /api/ai HTTP/1.1 200
```
