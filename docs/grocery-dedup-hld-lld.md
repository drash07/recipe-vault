# Grocery List Deduplication — HLD + LLD
**Date:** 2026-06-25 | **Status:** Approved, pending implementation

---

## Context / Problem
Grocery list built from meal plan had duplicate or near-duplicate items:
- "onion and bell pepper" treated as one item instead of two
- "tomato" and "tomatoes" appearing as separate lines
- Hindi ingredient names (jeera, haldi, palak) not matching English equivalents
- Quantities shown raw per-recipe, not summed
- No grouping — all items in one flat list, hard to shop by aisle

**Constraint:** Free Gemini API tier — AI-powered cleanup deferred to future upgrade. See TODO in RECIPE_VAULT_NOTES.md.

**Research:** Token-set ratio (fuzzywuzzy-style) is industry standard for ingredient matching; USDA FoodData Central API exists but overkill for this use case.

---

## HLD

Three layers applied at grocery list build time:

### Layer 1 — Smarter Ingredient Parsing
- **Compound split:** `"onion and bell pepper"` → `["onion", "bell pepper"]` before any normalization
- **Expanded synonym map:** 60+ entries — Hindi names (jeera→cumin, haldi→turmeric, aloo→potato, palak→spinach, besan→gram flour, hing→asafoetida, etc.) + Western variants (capsicum→bell pepper, cilantro→coriander, aubergine→eggplant, courgette→zucchini)
- **Token-set ratio fuzzy dedup:** Post-accumulation pass. Handles word-order differences without wrongly merging distinct items (`"cherry tomatoes"` vs `"tomatoes"` stays separate, threshold 0.88)

### Layer 2 — Quantity Summing
- Parse unicode fractions: `½→0.5`, `1 1/2→1.5`
- Convert to base units within compatible families: volume (tsp/tbsp/cup/ml/L), weight (g/kg/oz), count
- Same unit: sum → `"1 cup" + "2 cups"` = `"3 cups"`
- Mixed units: list → `"1 cup · 2 tbsp"` (no conversion)
- Count: `"3 tomatoes" + "2 tomatoes"` = `"5"`

### Layer 3 — Category Grouping (UI only)
Five sections in display order:
1. 🥦 **Produce** — fresh veg, fruit, herbs
2. 🥛 **Dairy & Eggs**
3. 🌾 **Grains & Pulses** — rice, dal, flour, pasta, oats
4. 🧂 **Spices & Herbs** — cumin, turmeric, coriander powder etc.
5. 🫙 **Pantry Staples** — shown last, muted, sub-label "check if you have these" (oil, ghee, salt, jaggery)
6. 📦 **Other** — catch-all for unclassified items

---

## LLD

**File:** `index.html` only. No new files.

### New Constants (near existing `PLURAL_FIX`)

```js
const SYNONYM_MAP = {
  // Hindi names
  'jeera': 'cumin', 'haldi': 'turmeric', 'dhaniya': 'coriander',
  'aloo': 'potato', 'palak': 'spinach', 'tamatar': 'tomato',
  'pyaaz': 'onion', 'lehsun': 'garlic', 'adrak': 'ginger',
  'besan': 'gram flour', 'atta': 'whole wheat flour',
  'hing': 'asafoetida', 'methi': 'fenugreek leaf',
  'kali mirch': 'black pepper', 'lal mirch': 'red chili',
  'shimla mirch': 'bell pepper', 'bhindi': 'okra',
  'lauki': 'bottle gourd', 'tinda': 'apple gourd',
  'rajma': 'kidney bean', 'chana': 'chickpea',
  'moong': 'mung bean', 'masoor': 'red lentil',
  'urad': 'black lentil', 'poha': 'flattened rice',
  'suji': 'semolina', 'rava': 'semolina',
  'imli': 'tamarind', 'kaju': 'cashew',
  'badam': 'almond', 'pista': 'pistachio',
  // Western variants
  'capsicum': 'bell pepper', 'cilantro': 'coriander',
  'spring onion': 'green onion', 'scallion': 'green onion',
  'aubergine': 'eggplant', 'courgette': 'zucchini',
  'chick pea': 'chickpea', 'ladyfinger': 'okra',
  'curd': 'yogurt',
};

const PRODUCE_KEYS = new Set(['tomato','onion','garlic','ginger','spinach',
  'bell pepper','carrot','potato','cucumber','eggplant','zucchini','mushroom',
  'lettuce','broccoli','cauliflower','pea','bean','green bean','lemon','lime',
  'orange','apple','banana','mango','papaya','avocado','corn','celery','radish',
  'beetroot','kale','cabbage','okra','bottle gourd','coriander','mint','basil',
  'parsley','spring onion','green onion','cherry tomato','chili','capsicum',
  'asparagus','artichoke','leek','fennel']);

const DAIRY_KEYS = new Set(['milk','cream','cheese','yogurt','butter','ghee',
  'paneer','egg','curd','sour cream','cream cheese','mozzarella','parmesan',
  'ricotta','condensed milk','evaporated milk','buttermilk','whipped cream']);

const GRAINS_KEYS = new Set(['rice','wheat','flour','bread','pasta','noodle',
  'oat','quinoa','lentil','chickpea','kidney bean','black bean','mung bean',
  'red lentil','black lentil','semolina','cornmeal','gram flour','whole wheat flour',
  'flattened rice','couscous','barley','millet','sorghum','buckwheat',
  'bread crumb','pita','tortilla','cracker','poha']);

const SPICES_KEYS = new Set(['cumin','coriander','turmeric','chili','pepper',
  'cardamom','cinnamon','clove','bay leaf','mustard seed','fennel seed',
  'fenugreek','asafoetida','star anise','garam masala','curry powder',
  'paprika','oregano','thyme','rosemary','sage','nutmeg','saffron',
  'black pepper','red chili','chili powder','coriander powder','cumin powder',
  'amchur','kasuri methi','black salt','rock salt']);

const PANTRY_KEYS = new Set(['oil','olive oil','coconut oil','sesame oil',
  'vegetable oil','ghee','salt','sugar','jaggery','honey','maple syrup',
  'vinegar','soy sauce','coconut milk','tomato paste','tamarind','water',
  'baking soda','baking powder','vanilla','cocoa','stock','broth','cornstarch',
  'arrowroot','agar','gelatin','yeast']);

const ML_UNITS = {tsp:5,teaspoon:5,tbsp:15,tablespoon:15,cup:240,ml:1,l:1000,litre:1000,liter:1000};
const G_UNITS  = {g:1,gram:1,kg:1000,oz:28,lb:453,pound:453};
```

### New Functions

```js
// Split "onion and bell pepper" → ["onion", "bell pepper"]
function splitCompound(raw) {
  return raw.split(/\s+and\s+|\s*[&+]\s*/i).map(s => s.trim()).filter(Boolean);
}

// Parse "1 ½", "1/2", "½", "2" → float
function parseQtyNum(s) {
  const FRAC = {'½':0.5,'¼':0.25,'¾':0.75,'⅓':0.333,'⅔':0.667,'⅛':0.125,'¾':0.75};
  s = s.trim();
  let n = 0;
  for (const [k,v] of Object.entries(FRAC)) s = s.replace(k, ' '+v);
  const parts = s.trim().split(/\s+/);
  for (const p of parts) {
    if (p.includes('/')) { const [a,b] = p.split('/'); n += parseFloat(a)/parseFloat(b); }
    else n += parseFloat(p) || 0;
  }
  return n;
}

// Parse "1 cup" → {amount:1, unit:'cup', family:'volume', base:240}
function parseQtyStr(qtyStr) {
  if (!qtyStr) return null;
  const m = qtyStr.trim().match(/^([\d\s½¼¾⅓⅔⅛.\/]+)\s*([a-z]+)?$/i);
  if (!m) return null;
  const amount = parseQtyNum(m[1]);
  const unit = (m[2]||'count').toLowerCase().replace(/s$/, ''); // strip trailing s
  if (ML_UNITS[unit]) return {amount, unit, family:'volume', base: amount * ML_UNITS[unit]};
  if (G_UNITS[unit])  return {amount, unit, family:'weight',  base: amount * G_UNITS[unit]};
  return {amount, unit: m[2]||'', family:'count', base: amount};
}

// Sum an array of raw qty strings; return display string
function sumQtys(qtyArr) {
  if (!qtyArr || !qtyArr.length) return '';
  const parsed = qtyArr.map(parseQtyStr).filter(Boolean);
  if (!parsed.length) return qtyArr.join(' · ');

  const byFamily = {};
  parsed.forEach(p => {
    if (!byFamily[p.family]) byFamily[p.family] = {total:0, unit:p.unit, entries:[]};
    byFamily[p.family].total += p.base;
    byFamily[p.family].entries.push(p);
  });

  const parts = [];
  for (const [family, {total, entries}] of Object.entries(byFamily)) {
    if (family === 'volume') {
      if (total >= 240) parts.push((Math.round(total/240*10)/10) + ' cups');
      else if (total >= 15) parts.push((Math.round(total/15*10)/10) + ' tbsp');
      else parts.push((Math.round(total/5*10)/10) + ' tsp');
    } else if (family === 'weight') {
      if (total >= 1000) parts.push((Math.round(total/100)/10) + ' kg');
      else parts.push(Math.round(total) + ' g');
    } else {
      const unit = entries[0].unit;
      parts.push(Math.round(total) + (unit ? ' '+unit : ''));
    }
  }
  return parts.join(' · ');
}

// Classify ingredient key into a category
function getCategory(key) {
  const tokens = key.split(' ');
  const check = (set) => set.has(key) || tokens.some(t => set.has(t));
  if (check(PANTRY_KEYS))  return 'pantry';
  if (check(PRODUCE_KEYS)) return 'produce';
  if (check(DAIRY_KEYS))   return 'dairy';
  if (check(GRAINS_KEYS))  return 'grains';
  if (check(SPICES_KEYS))  return 'spices';
  return 'other';
}

// Jaro string similarity
function jaro(s1, s2) {
  if (s1 === s2) return 1;
  const l1 = s1.length, l2 = s2.length;
  const md = Math.max(Math.floor(Math.max(l1,l2)/2)-1, 0);
  let matches = 0, t = 0;
  const m1 = new Array(l1).fill(false), m2 = new Array(l2).fill(false);
  for (let i=0;i<l1;i++) {
    for (let j=Math.max(0,i-md);j<Math.min(i+md+1,l2);j++) {
      if (m2[j]||s1[i]!==s2[j]) continue;
      m1[i]=m2[j]=true; matches++; break;
    }
  }
  if (!matches) return 0;
  let k=0;
  for (let i=0;i<l1;i++) {
    if (!m1[i]) continue;
    while (!m2[k]) k++;
    if (s1[i]!==s2[k]) t++;
    k++;
  }
  return (matches/l1+matches/l2+(matches-t/2)/matches)/3;
}

// Token-set ratio (handles word-order variants better than plain Jaro)
function tokenSetRatio(a, b) {
  const ta = new Set(a.split(' ')), tb = new Set(b.split(' '));
  const inter = [...ta].filter(t=>tb.has(t)).sort().join(' ');
  const ra = [...ta].filter(t=>!tb.has(t)).sort().join(' ');
  const rb = [...tb].filter(t=>!ta.has(t)).sort().join(' ');
  return Math.max(
    jaro((inter+' '+ra).trim(), (inter+' '+rb).trim()),
    jaro(inter, (inter+' '+ra).trim()),
    jaro(inter, (inter+' '+rb).trim())
  );
}

// Merge near-duplicate keys in the accumulator
function fuzzyDedup(all) {
  const keys = Object.keys(all);
  const dropped = new Set();
  for (let i=0;i<keys.length;i++) {
    if (dropped.has(keys[i])) continue;
    for (let j=i+1;j<keys.length;j++) {
      if (dropped.has(keys[j])) continue;
      if (tokenSetRatio(keys[i], keys[j]) >= 0.88) {
        const keep = all[keys[i]].count >= all[keys[j]].count ? keys[i] : keys[j];
        const drop = keep===keys[i] ? keys[j] : keys[i];
        all[keep].count += all[drop].count;
        all[keep].qtys.push(...all[drop].qtys);
        dropped.add(drop);
        delete all[drop];
      }
    }
  }
}
```

### Modified: `ingKey()`
Add before the final `return s`:
```js
if (SYNONYM_MAP[s]) return SYNONYM_MAP[s];
```

### Modified: Accumulation loop
```js
// Before:
meal.ingredients.forEach(raw => {
  const key = ingKey(raw);
  ...
});

// After:
meal.ingredients.forEach(raw => {
  splitCompound(raw).forEach(part => {
    const key = ingKey(part);
    const qty = ingQty(part);
    ...
  });
});
```

### Modified: `buildGroceryList()` — after accumulation, before `groceries = Object.values(all)`
```js
fuzzyDedup(all);
Object.values(all).forEach(item => {
  item.category = getCategory(item.name.toLowerCase());
  item.qtyDisplay = sumQtys(item.qtys);
});
```

### Modified: `renderGrocery()` — group by category
```js
const CAT_ORDER  = ['produce','dairy','grains','spices','pantry','other'];
const CAT_LABELS = {
  produce: '🥦 Produce', dairy: '🥛 Dairy & Eggs',
  grains: '🌾 Grains & Pulses', spices: '🧂 Spices & Herbs',
  pantry: '🫙 Pantry Staples', other: '📦 Other'
};

const byCategory = {};
groceries.forEach((g,i) => {
  const c = g.category||'other';
  (byCategory[c]=byCategory[c]||[]).push({...g,i});
});

let html = '';
for (const cat of CAT_ORDER) {
  const items = byCategory[cat];
  if (!items?.length) continue;
  const isPantry = cat==='pantry';
  html += `<div style="font-size:11px;font-weight:600;color:var(--text-muted);
             padding:10px 0 4px;${isPantry?'opacity:.7':''}">${CAT_LABELS[cat]}
             ${isPantry?'<span style="font-weight:400"> — check if you have these</span>':''}</div>`;
  html += items.map(({name,checked,qtyDisplay,count,i}) => `...`).join('');
}
list.innerHTML = html || '<div>No items yet...</div>';
```

---

## Decision Log
- **Why not AI cleanup?** Free Gemini tier — deferred. TODO in RECIPE_VAULT_NOTES.md.
- **Why token-set ratio over plain Jaro?** Handles word-order variants; Jaro alone fails on "fresh green beans" vs "green beans"
- **Why 0.88 threshold?** tomato/tomatoes → 0.94 (merge ✓); garlic/ginger → 0.78 (keep ✓); cherry tomato/tomato → ~0.79 (keep ✓)
- **Why pantry last?** Shopping behaviour — produce/dairy first, pantry only if running out
