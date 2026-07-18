# Instagram Bulk Import — HLD + LLD
**Date:** 2026-06-25 | **Status:** Approved, implemented

---

## Context / Problem
Drashti has 100s of recipe posts saved on Instagram (captions + comments).
Manual copy-paste one-at-a-time (existing Paste from Instagram feature) is too slow.
Need a one-shot bulk import that reads saved posts programmatically.

**Research findings:**
- Instagram MCP server (`@inoue2002/instagram-mcp`) exists but Playwright-based — more fragile
- `instagrapi` (Python, `subzeroid/instagrapi`) wraps Instagram's private mobile API — reliable, zero extra infra
- Comments from others on saved posts are NOT in the Instagram data export — must use API
- Instagram anti-bot measures in 2026 require session persistence + delays between calls

---

## HLD

**Approach: `instagrapi` Python script (one-off, runs from terminal)**

User flow:
1. `pip install instagrapi`
2. `python import_instagram.py`
3. Enter Instagram username + password (once — session saved to `ig_session.json`)
4. Script fetches all saved posts → caption + top 20 comments per post
5. Batches 5 posts at a time → Gemini detects + extracts recipes
6. Valid recipes saved directly to Supabase
7. Terminal prints summary: `✅ 34 imported | ⏭️ 67 skipped | 🔁 2 duplicates`

**What it handles:**
- Recipes in caption ✓
- Recipes in comments ✓ (fetches top 20 per post)
- Rate limiting: 5s delay between Gemini batches; 1s between comment fetches
- Duplicate detection: checks existing recipe names before saving
- Session persistence: re-running skips login

**Limitation:** instagrapi uses Instagram's private API — against ToS technically, but widely used for personal automation. Use on personal account only, with delays to avoid flagging.

---

## LLD

**New file:** `import_instagram.py`  
**Dependencies:** `pip install instagrapi` (zero changes to app files)  
**Also updated:** `.gitignore` (add `ig_session.json`)

### Constants
- `SESSION_FILE` — `ig_session.json` next to script
- `BATCH_SIZE = 5` — posts per Gemini call
- `BATCH_DELAY = 5` — seconds between Gemini calls (free tier: 15 req/min)
- `COMMENT_DELAY = 1` — seconds between per-post comment fetches
- `FETCH_COMMENTS = True` — set False to skip comments (faster, misses comment-only recipes)

### Functions

| Function | Purpose |
|---|---|
| `load_env()` | Read `.env` file (same pattern as server.py) |
| `get_client()` | Login via instagrapi, load/save session |
| `fetch_saved_posts(cl)` | `cl.user_saved_medias(cl.user_id, amount=1000)` |
| `build_post_text(cl, media)` | Caption + comments joined by `---` |
| `call_gemini(texts)` | Batch of 5 → Gemini → parsed recipe list |
| `validate_recipe(r)` | Must have name + ≥2 ingredients + ≥1 step |
| `normalize_recipe(r)` | Fix type/emoji/time defaults |
| `get_existing_names()` | Fetch all recipe names from Supabase |
| `save_recipe(recipe, index)` | POST to Supabase with unique id |
| `main()` | Orchestrate all, print summary |

### Gemini prompt
Send 5 posts separated by `===`. Return JSON array of 5 items — `null` if not a recipe, otherwise `{name, type, time, emoji, ingredients[], steps[]}`.

### Recipe fields saved to Supabase
`id` (timestamp+index), `name`, `type`, `time`, `emoji`, `ingredients[]`, `steps[]`, `source: 'instagram'`, `board: null`

---

## Decision Log
- **Why instagrapi over MCP?** Less setup, more reliable, handles comments
- **Why batch=5?** Gemini free tier limit; larger batches risk token overflow for long captions
- **Why 5s delay?** 15 req/min limit = 4s minimum; 5s gives headroom
- **Why check duplicates?** Script should be safe to re-run without double-importing
