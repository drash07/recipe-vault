#!/usr/bin/env python3
"""
import_instagram.py — Fetch saved Instagram posts → save raw text to ig_posts_raw.json
Claude Code then reads that file and extracts + saves recipes.

Setup:
    pip install instagrapi

Usage:
    python import_instagram.py
"""

import json, time, sys
from pathlib import Path
from getpass import getpass

# ── CONFIG ───────────────────────────────────────────────────────────────────
SESSION_FILE   = Path(__file__).parent / 'ig_session.json'
OUTPUT_FILE    = Path(__file__).parent / 'ig_posts_raw.json'
COMMENT_DELAY  = 1.5   # seconds between per-post comment fetches
FETCH_COMMENTS = True  # set False to skip comments (faster, misses comment-only recipes)

# ── INSTAGRAM LOGIN ───────────────────────────────────────────────────────────
def get_client():
    try:
        from instagrapi import Client
    except ImportError:
        print('\n❌  instagrapi not installed. Run:\n    pip install instagrapi\n')
        sys.exit(1)

    cl = Client()

    if SESSION_FILE.exists():
        print('📱 Loading saved session...')
        try:
            cl.load_settings(SESSION_FILE)
            cl.get_timeline_feed()
            print('✓  Session valid — skipping login\n')
            return cl
        except Exception:
            print('   Session expired — logging in fresh')
            SESSION_FILE.unlink(missing_ok=True)

    username = input('Instagram username: ').strip()
    password = getpass('Instagram password: ')
    print('   Logging in...')
    try:
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        print(f'✓  Logged in as @{username} (session saved)\n')
        return cl
    except Exception as e:
        print(f'\n❌  Login failed: {e}')
        print('    Tip: if 2FA is on, verify in the Instagram app then re-run.')
        sys.exit(1)


# ── COLLECTION PICKER ────────────────────────────────────────────────────────
def col_id(col):
    for attr in ('pk', 'id', 'collection_id'):
        v = getattr(col, attr, None)
        if v is not None:
            return v
    return None

def col_name(col, i):
    return getattr(col, 'name', None) or getattr(col, 'title', None) or f'Collection {i+1}'

def pick_collections(cl):
    print('📂 Fetching your saved collections...')
    try:
        cols = cl.collections()
    except Exception as e:
        print(f'   ⚠️  Could not fetch collections ({e}) — falling back to All Saved.')
        return None

    if not cols:
        print('   No collections found — will fetch All Saved Posts.')
        return None

    print(f'\n   Found {len(cols)} collection(s):\n')
    for i, col in enumerate(cols):
        count = getattr(col, 'media_count', '?')
        print(f'   [{i+1}] {col_name(col, i)}  ({count} posts)')

    print('\n   Enter numbers to import (e.g. 1,3) or press Enter for ALL:')
    raw = input('   > ').strip()

    if not raw:
        return cols

    chosen = []
    for part in raw.split(','):
        part = part.strip()
        if part.isdigit():
            idx = int(part) - 1
            if 0 <= idx < len(cols):
                chosen.append(cols[idx])
    return chosen if chosen else cols


# ── FETCH MEDIA ───────────────────────────────────────────────────────────────
def fetch_medias(cl):
    cols = pick_collections(cl)

    if cols is None:
        print('\n📥 Fetching all saved posts...')
        try:
            medias = cl.user_saved_medias(cl.user_id, amount=1000)
            print(f'   Found {len(medias)} saved posts\n')
            return medias
        except Exception as e:
            print(f'❌  Could not fetch saved posts: {e}')
            sys.exit(1)

    medias = []
    for i, col in enumerate(cols):
        name = col_name(col, i)
        cid  = col_id(col)
        print(f'\n📥 Fetching "{name}"...')
        try:
            col_medias = cl.collection_medias(cid, amount=1000)
            print(f'   {len(col_medias)} posts')
            medias.extend(col_medias)
        except Exception as e:
            print(f'   ⚠️  Could not fetch "{name}": {e}')

    print(f'\n   Total: {len(medias)} posts\n')
    return medias


# ── BUILD POST TEXT ───────────────────────────────────────────────────────────
def build_post_text(cl, media, index, total):
    parts = []

    caption = getattr(media, 'caption_text', '') or ''
    if caption.strip():
        parts.append(caption.strip())

    if FETCH_COMMENTS:
        try:
            comments = cl.media_comments(media.pk, amount=20)
            for c in comments:
                text = getattr(c, 'text', '') or ''
                if len(text.strip()) > 40:
                    parts.append(text.strip())
            time.sleep(COMMENT_DELAY)
        except Exception:
            pass

    if (index + 1) % 20 == 0 or (index + 1) == total:
        print(f'   {index+1}/{total} posts scanned...', flush=True)

    return '\n---\n'.join(parts)


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print()
    print('=' * 52)
    print('  Recipe Vault — Instagram Fetcher')
    print('  (Claude Code will process the output)')
    print('=' * 52)
    print()

    cl     = get_client()
    medias = fetch_medias(cl)

    if not medias:
        print('No posts found. Check your saved collections.')
        return

    print('💬 Scanning captions & comments...')
    posts = []
    skipped = 0

    for i, media in enumerate(medias):
        text = build_post_text(cl, media, i, len(medias))
        if len(text.strip()) < 80:
            skipped += 1
            continue
        posts.append({
            'index': i,
            'text': text,
            'post_id': str(getattr(media, 'pk', '')),
        })

    OUTPUT_FILE.write_text(
        json.dumps(posts, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )

    print()
    print('=' * 52)
    print(f'  ✅  {len(posts)} posts saved to ig_posts_raw.json')
    print(f'  ⏭️   {skipped} posts skipped (too short)')
    print('=' * 52)
    print()
    print('  Next: tell Claude Code to process ig_posts_raw.json')
    print()


if __name__ == '__main__':
    main()
