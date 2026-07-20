import json, urllib.request, urllib.error, os, re, time
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

ROOT  = Path(__file__).parent.parent
PORT  = int(os.environ.get('PORT', 8080))

try:
    from instagrapi import Client as IgClient
    IG_AVAILABLE = True
except ImportError:
    IG_AVAILABLE = False

SESSION_FILE = ROOT / 'metadata' / 'ig_session.json'
_ig_client   = None

def load_env():
    env      = dict(os.environ)   # Railway / production env vars
    env_file = ROOT / '.env'
    if env_file.exists():         # local .env overrides when present
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

ENV          = load_env()
CLAUDE_KEY   = ENV.get('CLAUDE_KEY', '')
SUPABASE_URL = ENV.get('SUPABASE_URL', '')
SUPABASE_KEY = ENV.get('SUPABASE_KEY', '')
CLAUDE_URL   = 'https://api.anthropic.com/v1/messages'
CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
POSTHOG_KEY  = ENV.get('POSTHOG_KEY', '')
SENTRY_DSN   = ENV.get('SENTRY_DSN', '')

if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN, integrations=[FlaskIntegration()], traces_sample_rate=0)

if not CLAUDE_KEY:   print('WARNING: CLAUDE_KEY not found in .env')
if not SUPABASE_URL: print('WARNING: SUPABASE_URL not found in .env')
if not IG_AVAILABLE: print('INFO: instagrapi not installed — Instagram import disabled. Run: pip install instagrapi')

# ── APP SETUP ─────────────────────────────────────────────────────
app     = Flask(__name__)
CORS(app)
limiter = Limiter(get_remote_address, app=app, default_limits=[])

# ── HELPERS ───────────────────────────────────────────────────────
def _ig_get_client():
    global _ig_client
    if _ig_client:
        try:
            _ig_client.get_timeline_feed()
            return _ig_client
        except Exception:
            _ig_client = None
    if SESSION_FILE.exists():
        try:
            cl = IgClient()
            cl.load_settings(SESSION_FILE)
            cl.get_timeline_feed()
            _ig_client = cl
            return cl
        except Exception:
            pass
    return None

def _call_claude(prompt, max_tokens=2000):
    body = json.dumps({
        'model': CLAUDE_MODEL,
        'max_tokens': max_tokens,
        'messages': [{'role': 'user', 'content': prompt}]
    }).encode()
    req = urllib.request.Request(
        CLAUDE_URL, data=body,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_KEY,
            'anthropic-version': '2023-06-01'
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        resp = json.loads(r.read())
    text = resp['content'][0]['text']
    text = re.sub(r'^\s*```(?:json)?\s*', '', text).rstrip('`').strip()
    return text

def _ig_call_claude(posts_texts):
    n        = len(posts_texts)
    combined = '\n===\n'.join(posts_texts)
    prompt   = (
        f'Extract recipes from {n} Instagram posts separated by ===.\n'
        f'Return a JSON array of exactly {n} items — null if not a recipe, otherwise:\n'
        f'{{"name":"...","type":"Breakfast|Dinner|Snack|Salad|Dessert","time":25,'
        f'"emoji":"🍛","ingredients":["qty ingredient"],"steps":["Step 1."]}}\n'
        f'Skip if: no ingredients+steps, contains meat/chicken/fish/mutton/pork/beef, or just an ad.\n\n'
        f'{combined}'
    )
    return json.loads(_call_claude(prompt, max_tokens=2000))

def _sb_request(method, path, token, data=None):
    body    = json.dumps(data).encode() if data else None
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    req = urllib.request.Request(
        f'{SUPABASE_URL}{path}', data=body, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else []
    except urllib.error.HTTPError as e:
        return e.code, []

# ── STATIC FILES ──────────────────────────────────────────────────
@app.route('/')
def index():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = html.replace('__SUPABASE_URL__', SUPABASE_URL)
    html = html.replace('__SUPABASE_KEY__', SUPABASE_KEY)
    html = html.replace('__POSTHOG_KEY__', POSTHOG_KEY)
    html = html.replace('__SENTRY_DSN__', SENTRY_DSN)
    return make_response(html, 200, {'Content-Type': 'text/html'})

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(str(ROOT), path)

# ── AI ────────────────────────────────────────────────────────────
@app.route('/api/ai', methods=['POST'])
@limiter.limit('20 per minute')
def api_ai():
    data       = request.get_json(force=True)
    prompt     = data.get('prompt', '')
    max_tokens = data.get('maxTokens', 1200)
    if not prompt:
        return jsonify({'error': 'prompt required'}), 400
    print(f'  AI request: {prompt[:80]}...')
    try:
        text = _call_claude(prompt, max_tokens=max_tokens)
        try:
            json.loads(text)
        except Exception:
            m = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
            if m: text = m.group(1)
        print(f'  AI response: {text[:100]}...')
        return jsonify({'text': text})
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f'  Claude error {e.code}:', err)
        return jsonify({'error': err}), e.code
    except Exception as e:
        print('  AI error:', e)
        return jsonify({'error': str(e)}), 500

# ── URL FETCH ─────────────────────────────────────────────────────
@app.route('/api/fetch-url', methods=['POST'])
@limiter.limit('30 per minute')
def api_fetch_url():
    data = request.get_json(force=True)
    url  = data.get('url', '')
    if not url.startswith('http'):
        return jsonify({'error': 'Invalid URL'}), 400
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode('utf-8', errors='ignore')
        raw = re.sub(r'<(script|style)[^>]*>.*?</(script|style)>', ' ', raw, flags=re.DOTALL|re.IGNORECASE)
        raw = re.sub(r'<[^>]+>', ' ', raw)
        raw = re.sub(r'[ \t]+', ' ', raw)
        raw = re.sub(r'\n{3,}', '\n\n', raw).strip()
        print(f'  Fetched URL: {url[:60]} ({len(raw)} chars)')
        return jsonify({'text': raw[:8000]})
    except Exception as e:
        print(f'  Fetch error: {e}')
        return jsonify({'error': str(e)}), 500

# ── INSTAGRAM ─────────────────────────────────────────────────────
@app.route('/api/ig/status', methods=['GET'])
@limiter.limit('10 per minute')
def api_ig_status():
    if not IG_AVAILABLE:
        return jsonify({'connected': False, 'error': 'instagrapi not installed'})
    cl = _ig_get_client()
    if cl:
        try:
            info = cl.account_info()
            return jsonify({'connected': True, 'username': info.username})
        except Exception:
            return jsonify({'connected': False})
    return jsonify({'connected': False})

@app.route('/api/ig/collections', methods=['GET'])
@limiter.limit('10 per minute')
def api_ig_collections():
    if not IG_AVAILABLE:
        return jsonify({'error': 'instagrapi not installed'}), 503
    cl = _ig_get_client()
    if not cl:
        return jsonify({'error': 'Not connected to Instagram'}), 401
    try:
        cols   = cl.collections()
        result = [{'id': 'saved_all', 'name': 'All Saved Posts', 'count': '—'}]
        for c in cols:
            result.append({'id': str(c.pk), 'name': c.name, 'count': c.media_count or 0})
        return jsonify({'collections': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ig/session', methods=['POST'])
@limiter.limit('10 per minute')
def api_ig_session():
    global _ig_client
    if not IG_AVAILABLE:
        return jsonify({'error': 'instagrapi not installed'}), 503
    data       = request.get_json(force=True)
    session_id = data.get('session_id', '').strip()
    if not session_id:
        return jsonify({'error': 'session_id required'}), 400
    try:
        cl = IgClient()
        cl.login_by_sessionid(session_id)
        cl.dump_settings(SESSION_FILE)
        _ig_client = cl
        info = cl.account_info()
        return jsonify({'ok': True, 'username': info.username})
    except Exception as e:
        return jsonify({'error': 'Could not connect: ' + str(e)}), 401

@app.route('/api/ig/login', methods=['POST'])
@limiter.limit('5 per minute')
def api_ig_login():
    global _ig_client
    if not IG_AVAILABLE:
        return jsonify({'error': 'instagrapi not installed'}), 503
    data     = request.get_json(force=True)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    try:
        cl = IgClient()
        if SESSION_FILE.exists(): cl.load_settings(SESSION_FILE)
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        _ig_client = cl
        return jsonify({'ok': True, 'username': username})
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/ig/import', methods=['POST'])
@limiter.limit('5 per minute')
def api_ig_import():
    global _ig_client
    if not IG_AVAILABLE:
        return jsonify({'error': 'instagrapi not installed'}), 503
    data            = request.get_json(force=True)
    collection_id   = data.get('collection_id', 'saved_all')
    collection_name = data.get('collection_name', 'Saved Posts')
    sb_token        = data.get('token', SUPABASE_KEY)
    user_id         = data.get('user_id', '')
    cl = _ig_get_client()
    if not cl:
        return jsonify({'error': 'Not connected to Instagram'}), 401
    try:
        medias = (
            cl.user_saved_medias(cl.user_id, amount=100)
            if collection_id == 'saved_all'
            else cl.collection_medias_v1(int(collection_id), amount=100)
        )
        if not medias:
            return jsonify({'imported': 0, 'skipped_dupe': 0, 'skipped_no_recipe': 0, 'no_recipes': True})
        _, existing    = _sb_request('GET', '/rest/v1/recipes?select=name&limit=500', sb_token)
        existing_names = {r['name'].lower() for r in (existing or [])}
        _, max_rows    = _sb_request('GET', '/rest/v1/recipes?select=id&order=id.desc&limit=1', sb_token)
        next_id        = ((max_rows[0]['id'] if max_rows else 0) + 1)
        imported = skipped_dupe = skipped_no_recipe = 0
        posts_texts = [(m.caption_text or '').strip() for m in medias]
        BATCH = 5
        for i in range(0, len(posts_texts), BATCH):
            batch = [t for t in posts_texts[i:i+BATCH] if t]
            skipped_no_recipe += (BATCH - len(batch))
            if not batch: continue
            try:
                results = _ig_call_claude(batch)
                if not isinstance(results, list): results = []
                while len(results) < len(batch): results.append(None)
                for recipe in results:
                    if not recipe or not recipe.get('name'):
                        skipped_no_recipe += 1; continue
                    if recipe['name'].lower() in existing_names:
                        skipped_dupe += 1; continue
                    payload = {
                        'id': next_id, 'name': recipe['name'],
                        'type': recipe.get('type', 'Dinner'),
                        'time': int(recipe.get('time') or 30),
                        'emoji': recipe.get('emoji', '🍽'),
                        'ingredients': recipe.get('ingredients', []),
                        'steps': recipe.get('steps', []),
                        'source': 'instagram', 'board': None,
                        'shared': True, 'user_id': user_id
                    }
                    status, _ = _sb_request('POST', '/rest/v1/recipes', sb_token, payload)
                    if status in (200, 201):
                        existing_names.add(recipe['name'].lower())
                        imported += 1; next_id += 1
                    else:
                        skipped_no_recipe += 1
            except Exception as ex:
                print('Batch error:', ex)
                skipped_no_recipe += len(batch)
            if i + BATCH < len(posts_texts): time.sleep(5)
        return jsonify({
            'imported': imported, 'skipped_dupe': skipped_dupe,
            'skipped_no_recipe': skipped_no_recipe,
            'no_recipes': imported == 0 and skipped_dupe == 0
        })
    except Exception as e:
        print('Import error:', e)
        return jsonify({'error': str(e)}), 500

# ── START ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    from waitress import serve
    os.chdir(ROOT)
    print()
    print('=' * 45)
    print('  Recipe Vault — Ready!')
    print(f'  Claude: {CLAUDE_MODEL}')
    print(f'  Open: http://localhost:{PORT}')
    print('  Ctrl+C to stop')
    print('=' * 45)
    print()
    serve(app, host='0.0.0.0', port=PORT, threads=4)
