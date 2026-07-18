# Recipe Vault — CLAUDE.md

Ground truth for the project. Read this before touching any file. All architectural decisions are recorded in `decision-making.md`.

---

## Project Overview

Recipe Vault is a personal meal-planning PWA. Core features: weekly meal plan, shared recipe vault, AI suggestions, smart grocery list, and Instagram recipe import. The app supports all dietary preferences (vegetarian, vegan, flexible, custom allergies) configured per user during onboarding. Targeting mobile-first deployment as a PWA today and a Capacitor native app (Phase 4).

**Live URL:** https://drash07.github.io/recipe-vault/
**Working directory:** `C:\Users\patel\Downloads\recipe-vault\`

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vanilla JS (ES6+), HTML5, CSS3 | No framework, no build step, no npm |
| Fonts | Playfair Display (headings), DM Sans (body) | Google Fonts CDN |
| Backend | Python `http.server` → Flask + Gunicorn (Step 2) | Single file: `server/server.py` |
| Database | Supabase (PostgreSQL) | Via `@supabase/supabase-js` CDN |
| Auth | Supabase magic link (passwordless email) | No passwords |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) | Server-side only — key never in browser |
| Instagram import | `instagrapi` (Python) | Private mobile API; requires `sessionid` cookie |
| Hosting (web) | GitHub Pages | Auto-deploy via `.github/workflows/deploy.yml` |
| Hosting (server) | Railway (Step 4) | Env vars in Railway dashboard |
| Mobile (Phase 4) | Capacitor | Wraps PWA; `@capacitor/browser` for Instagram OAuth |

---

## Folder Structure

```
recipe-vault/
├── index.html                        # Entry point — all screens, modals, script tags
├── manifest.json                     # PWA manifest
├── capacitor.config.json             # Capacitor config (Phase 4)
│
├── src/
│   ├── theme/
│   │   ├── variables.css             # CSS custom properties ONLY (colors, radii, fonts)
│   │   ├── components.css            # Reusable UI: buttons, cards, chips, badges, inputs, modals
│   │   └── app.css                   # Layout, screens, bottom nav, overlays, safe-area insets
│   │
│   ├── core/                         # Infrastructure — no feature dependency, loaded first
│   │   ├── state.js                  # ALL shared state (let recipes[], mealPlan, currentUser…)
│   │   ├── db.client.js              # initDB() — Supabase client init only
│   │   ├── db.recipes.js             # loadRecipes(), upsertRecipe()
│   │   ├── db.mealplan.js            # loadMealPlan(), saveMealSlot()
│   │   ├── db.groceries.js           # loadGroceries(), persistGroceries()
│   │   ├── ui.nav.js                 # navigate(), switchHomeTab(), restoreActiveTab()
│   │   ├── ui.modals.js              # openModal(), closeModal()
│   │   ├── ui.toasts.js              # showError(), showStatus(), hideStatus()
│   │   └── ai.js                     # callAI() — POST /api/ai only, never direct Claude
│   │
│   ├── components/                   # Reusable DOM builders — return HTML strings
│   │   ├── recipe-card.js            # recipeCardHtml(recipe) → HTML string
│   │   ├── source-badge.js           # SVG constants + sourceBadgeHtml(source)
│   │   └── sweetener-tag.js          # sweetenerTagHtml(recipe, userProfile)
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.js               # sendMagicLink(), handleSession(), signOut()
│   │   │   ├── setup.js              # SETUP_STEPS, renderSetupStep(), saveSetup()
│   │   │   └── profile.js            # renderProfileScreen()
│   │   │
│   │   ├── recipes/
│   │   │   ├── recipes.filter.js     # _matchesPreferences() — dietary preference logic
│   │   │   ├── recipes.list.js       # renderRecipes(), setFilter(), switchRecipeView(), renderFilterChips()
│   │   │   ├── recipes.detail.js     # showRecipeDetail()
│   │   │   └── recipes.form.js       # openAddModal(), saveNewRecipe()
│   │   │
│   │   ├── plan/
│   │   │   ├── plan.week.js          # renderWeekGrid(), week prev/next navigation
│   │   │   ├── plan.slots.js         # renderMealSlots(), openMealPicker(), clearMealSlot()
│   │   │   ├── plan.ai.js            # openSuggestModal(), loadAiSuggestions(), smart plan
│   │   │   ├── plan.nutrition.js     # Nutrition tab — render + AI call
│   │   │   ├── plan.prep.js          # Prep timeline tab — render + AI call
│   │   └── plan.ingredients.js   # "Use my ingredients" modal — search + AI generate
│   │   │
│   │   ├── grocery/
│   │   │   ├── grocery.dedup.js      # PLURAL_FIX, SYNONYM_MAP, normalise(), 3-layer dedup
│   │   │   ├── grocery.generate.js   # generateGroceryList() — extracts from meal plan
│   │   │   └── grocery.render.js     # renderGrocery(), toggleItem(), clearList()
│   │   │
│   │   └── import/
│   │       ├── instagram.js          # Instagram import modal state machine
│   │       └── paste.js              # Paste-a-recipe: URL fetch → AI extract
│   │
│   └── utils/
│       ├── date.js                   # DAYS, FULL_DAYS, today, todayIdx, getWeekStart()
│       └── platform.js               # isNative(), isAndroid(), isIOS() — Capacitor checks
│
├── assets/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── server/
│   ├── server.py                     # All backend logic — AI proxy, IG import, static serving
│   ├── requirements.txt              # pip dependencies
│   └── .env.example                  # Secret template (never commit .env)
│
├── docs/                             # HLD/LLD design docs
├── ig_batches/                       # Raw Instagram batch data (dev only)
├── android/                          # Auto-generated by Capacitor — never hand-edit
├── ios/                              # Auto-generated by Capacitor — never hand-edit
│
├── CLAUDE.md                         # This file
├── decision-making.md                # All architectural trade-offs and decisions
├── RECIPE_VAULT_NOTES.md             # Dev notes — updated when user says "remember/note it"
└── .claude/
    └── commands/                     # Slash skills: bug.md, feature.md, deploy.md, recap.md
```

---

## Architecture

### No build step — ever

There is no webpack, vite, rollup, or bundler. No `package.json`. External libraries load via CDN `<script>` tags in `index.html`. This is intentional — zero tooling overhead, instant local dev.

### Script load order (law — do not reorder)

All JS files are `<script>` tags in `index.html`. The dependency direction is always:

```
utils → core → components → features
```

Exact order:

```
src/utils/date.js
src/core/state.js
src/core/db.client.js
src/core/db.recipes.js
src/core/db.mealplan.js
src/core/db.groceries.js
src/core/ui.toasts.js
src/core/ui.nav.js
src/core/ui.modals.js
src/core/ai.js
src/components/source-badge.js
src/components/sweetener-tag.js
src/components/recipe-card.js
src/features/auth/auth.js
src/features/auth/setup.js
src/features/auth/profile.js
src/features/recipes/recipes.filter.js
src/features/recipes/recipes.list.js
src/features/recipes/recipes.detail.js
src/features/recipes/recipes.form.js
src/features/plan/plan.week.js
src/features/plan/plan.slots.js
src/features/plan/plan.ai.js
src/features/plan/plan.nutrition.js
src/features/plan/plan.prep.js
src/features/grocery/grocery.dedup.js
src/features/grocery/grocery.generate.js
src/features/grocery/grocery.render.js
src/features/import/instagram.js
src/features/import/paste.js
src/utils/platform.js
```

### Global scope is intentional

No `import`/`export`. Functions declared in one file are callable from all others. This is the designed contract of the no-build architecture. Never wrap files in IIFEs.

### Single-page app

All screens live in the DOM simultaneously. Navigation only toggles `.active` CSS class — never loads new HTML. All modals are pre-rendered in `index.html`.

### State ownership

| What | Lives in |
|------|---------|
| All shared mutable state | `src/core/state.js` only |
| Supabase queries | `src/core/db.*.js` only |
| Navigation + modal logic | `src/core/ui.*.js` only |
| AI calls | `src/core/ai.js` only |
| Reusable HTML builders | `src/components/*.js` |
| Feature business logic | `src/features/<feature>/*.js` |
| Pure utilities | `src/utils/*.js` |

Never declare shared state inside a feature file. Never put Supabase queries inside a render function.

---

## Backend (`server/server.py`)

Single Python file. Handles:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` (all static) | GET | Serves `index.html` (with secret injection) + all JS/CSS/assets |
| `/api/ai` | POST | `{prompt, maxTokens}` → Claude API → `{text}` |
| `/api/fetch-url` | POST | Server-side URL fetch (avoids browser CORS) for paste-a-recipe |
| `/api/ig/status` | GET | Checks if instagrapi session is active |
| `/api/ig/collections` | GET | Lists Instagram saved collections |
| `/api/ig/session` | POST | Accepts `sessionid` cookie, creates instagrapi session |
| `/api/ig/import` | POST | Imports recipes from an IG collection via Claude |

**Rules:**
- All env vars loaded once at module start via `load_env()` — never re-read per request.
- All Claude calls go through `_call_claude(prompt, max_tokens)` — never call the URL directly.
- All Supabase REST calls go through `_sb_request(method, path, token, data)`.
- Always return `self._json(code, {"error": msg})` on failure — never swallow silently.

---

## Supabase Schema

```
recipes      — id, name, type, time, emoji, ingredients[], steps[], tags[],
               source, board, shared, user_id
meal_plan    — user_id, day_index, meal_type, recipe_id, recipe_data (jsonb), week_start
groceries    — user_id, name, checked, count, week_start
profiles     — user_id, display_name, dietary_type, eggs_ok, sweet_pref,
               meal_types[], allergies[], time_weeknight, lunch_style, sweeteners[]
```

**RLS policy:** `auth.uid() = user_id OR shared = true` enforced database-side. Never replicate this filter in JS.

---

## Coding Rules

### General

- No comments explaining WHAT code does — names do that. Only comment WHY when it is non-obvious (hidden constraint, specific bug, subtle invariant).
- No feature flags, backwards-compat shims, or dead code.
- Smallest change that fixes the root cause — no unrelated cleanup in the same edit.
- No error handling for scenarios that cannot happen. Trust Supabase SDK guarantees.

### JavaScript

- `'use strict';` at top of every file.
- `const` for things that never change, `let` for everything else. Never `var`.
- **New shared state** → `core/state.js` only.
- **New Supabase query** → correct `core/db.*.js` file.
- **New generic UI helper** → correct `core/ui.*.js` file.
- **New reusable HTML builder** → `components/`.
- **Feature logic** → stays in its `features/<name>/` file.
- Naming conventions:
  - `renderXxx()` — pure DOM write, no network calls, no side effects
  - `loadXxx()` — async, fetches from Supabase, then calls `renderXxx()`
  - `saveXxx()` / `persistXxx()` — async, writes to Supabase
  - `openXxx()` / `closeXxx()` — modal or overlay control
  - `XxxHtml(data)` — component function, returns an HTML string

### CSS

- All design token changes → `src/theme/variables.css` only.
- New reusable component style → `src/theme/components.css`.
- Screen-specific layout → `src/theme/app.css`.
- Never use inline `style=` for values that repeat — extract to a class.
- Never hardcode hex colors in JS or inline HTML — always use `var(--token)`.

### Capacitor (Phase 4)

- Always check platform before calling a native plugin:
  ```javascript
  // src/utils/platform.js
  function isNative() { return window.Capacitor?.isNativePlatform() ?? false; }
  function isIOS()    { return window.Capacitor?.getPlatform() === 'ios'; }
  function isAndroid(){ return window.Capacitor?.getPlatform() === 'android'; }
  ```
- Safe-area insets are declared in `app.css` — never hardcode pixel offsets for notches/home bars.
- `android/` and `ios/` folders are auto-generated by `npx cap sync` — never hand-edit them.

### Security

- **Claude API key never touches the browser.** Lives in `server/.env` only.
- `index.html` may only contain the Supabase anon key (public by design) and Supabase URL.
- No sensitive data in `localStorage` — session tokens managed by the Supabase SDK.
- CORS is currently `*` for dev. Lock to GitHub Pages + Railway domains before public launch.

---

## Design System

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--saffron` | `#E8680A` | Primary CTA, active state, brand |
| `--saffron-light` | `#FDF0E6` | Highlighted area backgrounds |
| `--saffron-dark` | `#B84E00` | Pressed/hover |
| `--turmeric` | `#F5A623` | Secondary accent, setup progress |
| `--turmeric-light` | `#FEF8EE` | Soft highlight background |
| `--leaf` | `#2D7A4F` | Success, veg badge |
| `--leaf-light` | `#EAF5EE` | Success backgrounds |
| `--berry` | `#7B4F9E` | Weekend / special indicators |
| `--berry-light` | `#F3EEF9` | Weekend card background |
| `--border` | `#EAE4DA` | Card borders, dividers |
| `--text` | `#1A1410` | Primary text |
| `--text-muted` | `#8A7E75` | Secondary text, labels, hints |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--bg` | `#FDFAF5` | Page background (warm off-white) |

### Typography

| Use | Family | Size |
|-----|--------|------|
| App logo, screen titles, recipe names | `Playfair Display`, serif | 18–26px |
| All body, buttons, labels | `DM Sans`, sans-serif | 14px base |
| Hints, metadata, badges | `DM Sans` | 11–12px |

### Layout

- **Max width:** `420px`, centered `margin: 0 auto` — mobile-only, always.
- **Border radius:** `--radius: 14px` (cards, modals) · `--radius-sm: 8px` (buttons, chips)
- **Bottom nav:** `64px` height — body always has `padding-bottom: 80px`
- **Safe areas (Capacitor):** `padding-top: env(safe-area-inset-top)` on root layout; `padding-bottom: env(safe-area-inset-bottom)` on nav

### Component Classes

| Class | Use |
|-------|-----|
| `.btn .btn-primary` | Saffron filled CTA |
| `.btn .btn-outline` | Border-only button |
| `.btn .btn-sm` | Compact button |
| `.btn .btn-full` | Full-width button |
| `.card` | Standard content card |
| `.card-sm` | Compact card |
| `.modal` + `.open` | Modal visibility (toggled by JS) |
| `.filter-chip` + `.active` | Horizontal filter tab |
| `.recipe-tag` | Neutral pill tag |
| `.recipe-tag.pink` | Board/collection tag |
| `.source-badge .src-instagram` | Instagram source icon |
| `.source-badge .src-pinterest` | Pinterest source icon |
| `.source-badge .src-ai` | AI-generated badge |
| `.source-badge .src-manual` | Manually added badge |

---

## Local Development

### Prerequisites

```bash
pip install instagrapi   # optional — only for Instagram import feature
```

### Run locally

```bash
cd C:\Users\patel\Downloads\recipe-vault
python server\server.py
# Open http://localhost:8080
```

The server serves all static files AND `/api/*` endpoints. No separate frontend server needed.

### Environment variables

`server/.env` (never committed):

```
CLAUDE_KEY=sk-ant-api03-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
```

### Dev bypass

On `localhost`, `src/features/auth/auth.js` skips the login flow and loads Drashti's profile directly. This must stay intact — it is the local development path, not a bug.

---

## Deployment

### Web → GitHub Pages

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) injects `SUPABASE_URL` + `SUPABASE_KEY` from GitHub Secrets into `index.html` → deploys.

**Only deploy when Drashti explicitly says "deploy." Never proactively.**

### Server → Railway (Step 4)

Set `CLAUDE_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` in Railway environment. Server runs via Gunicorn after Step 2 (Flask upgrade).

### Mobile → Capacitor (Phase 4)

Build order — always follow this sequence:

```bash
# 1. Ensure server is deployed on Railway first
# 2. Update API base URL in src/core/ai.js and src/core/db.client.js to Railway URL
npx cap sync                  # syncs web assets to android/ and ios/
npx cap open android          # opens Android Studio → build AAB → Google Play Internal Testing
npx cap open ios              # opens Xcode (Mac only) → build IPA → TestFlight
```

---

## Pre-Launch Checklist

- [x] Step 1 — Claude API switch (server-side, key never in browser)
- [ ] Step 2 — Flask + Gunicorn, rate limiting on `/api/ai` and `/api/ig/*`
- [ ] Step 3 — PostHog analytics + Sentry error tracking
- [ ] Step 4 — Railway deploy (must be done before mobile build)
- [ ] Step 5 — Capacitor + Android + Google Play Internal Testing
- [ ] Step 6 — iOS + TestFlight (requires Mac + $99 Apple Developer account)

---

## Key Invariants — Do Not Break

1. **Script load order:** `utils → core → components → features`. `state.js` and `date.js` are always first.
2. **Claude key never in browser.** `index.html` must never contain `CLAUDE_KEY`.
3. **`core/state.js` owns all shared state.** No `let recipes = []` anywhere else.
4. **Render functions are side-effect free.** `renderXxx()` only writes to the DOM — no fetches, no state mutations.
5. **Supabase RLS is the authority on data access.** Never replicate `user_id` filtering in JS.
6. **`android/` and `ios/` are generated.** Never hand-edit them — changes are overwritten by `cap sync`.
7. **Dev bypass on localhost stays.** Do not remove the `location.hostname === 'localhost'` auth skip.
