# Recipe Vault — Decision Log

Running record of options considered and decisions made. Add an entry any time we evaluate trade-offs.

---

## [2026-07-17] Mobile app transition approach

**Question:** How do we take the PWA to a native mobile app?

| Option | Pros | Cons |
|--------|------|------|
| PWA only (no native) | Zero extra work | No app store presence, no native plugins, Instagram cookie flow broken |
| React Native rewrite | Truly native UI | Full rewrite, throw away all existing HTML/JS |
| **Capacitor wrapper** ✅ | Wraps existing PWA as-is, native plugin access, app store ready | WebView performance ceiling, requires Android Studio / Xcode |
| Flutter rewrite | Best native performance | Full rewrite in Dart, even more work |

**Decision:** Capacitor wrapper — preserves all existing code, unlocks native plugins (especially `@capacitor/browser` for Instagram login), fastest path to Google Play + App Store.

---

## [2026-07-17] Instagram saved posts access method

**Question:** How do we access a user's Instagram saved posts?

| Option | Pros | Cons |
|--------|------|------|
| Official Meta Graph API | Legitimate, stable | Meta deprecated saved posts endpoint Dec 2024 — impossible |
| Username + password form | Simple to build | Users won't trust it; against Instagram ToS |
| **instagrapi (private mobile API)** ✅ | Works today, accesses saved posts/collections | Not officially sanctioned; could break if Instagram changes internals |
| Manual copy-paste by user | Always works | Terrible UX |

**Decision:** instagrapi via `login_by_sessionid()`. Phase 4 (Capacitor) captures the `sessionid` cookie from Instagram's real login page via `@capacitor/browser` — user authenticates on Instagram's own UI, we never touch their password.

---

## [2026-07-17] AI provider

**Question:** Gemini or Claude for AI suggestions and recipe extraction?

| Option | Pros | Cons |
|--------|------|------|
| Gemini 2.0 Flash | 1500 req/day free tier | Drashti already has Claude Max; separate key to manage |
| **Claude (Haiku)** ✅ | Covered by Claude Max subscription, better instruction following | Costs per token beyond free tier |

**Decision:** Claude API (`claude-haiku-4-5-20251001`). Key stored server-side only — never injected into browser HTML.

---

## [2026-07-17] AI key location (security)

**Question:** Where does the Claude API key live?

| Option | Pros | Cons |
|--------|------|------|
| In `index.html` as a JS constant | Easy to read client-side | Key exposed to anyone who views source — high security risk |
| **Server-side only in `.env`** ✅ | Key never leaves the server | Requires all AI calls to go through server.py |

**Decision:** Server-side only. `index.html` contains only Supabase public keys. All AI calls route through `/api/ai` on `server.py`.

---

## [2026-07-18] Server framework

**Question:** Keep stdlib `http.server` or upgrade to Flask?

| Option | Pros | Cons |
|--------|------|------|
| `http.server` (current) | Zero dependencies, simple | Single-threaded, no rate limiting, not production-grade |
| Flask + Gunicorn | Industry standard on Linux | Gunicorn is Linux-only — doesn't run on Windows for local dev |
| **Flask + Waitress** ✅ | Proper routing, rate limiting, runs on Windows AND Linux (Railway) | Small dependency addition |
| FastAPI | Async, auto-docs | Overkill for current scale |

**Decision:** Flask + Waitress. One server that works identically on Windows (local dev) and Railway (Linux). No Gunicorn needed.

---

## Template for new decisions

```
## [YYYY-MM-DD] <Topic>

**Question:** <What are we deciding?>

| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| **Chosen option** ✅ | ... | ... |

**Decision:** <What we chose and the one-line reason why.>
```
