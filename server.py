import http.server, json, urllib.request, urllib.error, os
import re, json as _json
from pathlib import Path

PORT = 3000

# ── ENV LOADER ───────────────────────────────────────────────────────────────
# Reads a local .env file (never committed to git) and loads into os.environ.
# You can also set these as real environment variables instead.
def load_env():
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, val = line.partition('=')
                val = val.strip().strip('"').strip("'")
                os.environ.setdefault(key.strip(), val)

load_env()

GEMINI_KEY   = os.environ.get("GEMINI_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
GEMINI_URL   = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

if not GEMINI_KEY:
    print("  WARNING: GEMINI_KEY not set — AI features will not work.")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("  WARNING: SUPABASE_URL / SUPABASE_KEY not set — database will not connect.")

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, f, *a): print(" ", a[0], a[1])

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

    def do_OPTIONS(self):
        try:
            self.send_response(200)
            self.cors()
            self.end_headers()
        except: pass

    def do_GET(self):
        try:
            p = self.path.split("?")[0]
            if p in ("/", ""): p = "/index.html"
            fp = self.translate_path(p)
            data = open(fp, "rb").read()
            mime = {".html":"text/html",".js":"text/javascript",".css":"text/css"}.get(Path(fp).suffix, "application/octet-stream")
            # Inject credentials into index.html at serve time — keys never stored in source
            if Path(fp).name == "index.html":
                html = data.decode("utf-8")
                html = html.replace("__GEMINI_KEY__",   GEMINI_KEY)
                html = html.replace("__SUPABASE_URL__", SUPABASE_URL)
                html = html.replace("__SUPABASE_KEY__", SUPABASE_KEY)
                data = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.cors()
            self.end_headers()
            self.wfile.write(data)
        except ConnectionAbortedError: pass
        except FileNotFoundError:
            try: self.send_response(404); self.end_headers()
            except: pass
        except Exception as e:
            print("GET error:", e)

    def _call_gemini(self, prompt, max_tokens=1200, temperature=0.7):
        body = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}
        }).encode()
        req = urllib.request.Request(
            GEMINI_URL,
            data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read())
        text = resp["candidates"][0]["content"]["parts"][0]["text"]
        text = re.sub(r'^\s*```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```\s*$', '', text)
        text = text.strip()
        try:
            _json.loads(text)
        except Exception:
            m = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
            if m: text = m.group(1)
        return text

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body_raw = self.rfile.read(length)

            if self.path == "/api/ai":
                req_data = json.loads(body_raw)
                prompt = req_data.get("prompt", "")
                max_tokens = req_data.get("maxTokens", 1200)
                print(f"  AI request: {prompt[:80]}...")
                text = self._call_gemini(prompt, max_tokens)
                print(f"  AI response: {text[:100]}...")
                self._json(200, {"text": text})

            elif self.path == "/api/import":
                req_data = json.loads(body_raw)
                url = req_data.get("url", "").strip()
                if not url:
                    self._json(400, {"error": "No URL provided"})
                    return
                print(f"  Import URL: {url}")
                page_req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (compatible; RecipeVault/1.0)"}
                )
                with urllib.request.urlopen(page_req, timeout=15) as r:
                    html_bytes = r.read(500000)
                html_text = html_bytes.decode("utf-8", errors="ignore")
                clean = html_text
                for tag in ['script', 'style', 'nav', 'footer', 'header']:
                    clean = re.sub(r'<' + tag + r'[^>]*>.*?</' + tag + r'>', ' ', clean, flags=re.DOTALL|re.IGNORECASE)
                clean = re.sub(r'<[^>]+>', ' ', clean)
                clean = re.sub(r'&[a-z#0-9]+;', ' ', clean)
                clean = re.sub(r'\s+', ' ', clean).strip()
                clean = clean[:5000]
                print(f"  Page text ({len(clean)} chars): {clean[:80]}...")
                import_prompt = (
                    'Extract the recipe from this webpage text. '
                    'Return ONLY a JSON object, no markdown: '
                    '{"name":"","time":25,"type":"Dinner","emoji":"","ingredients":[],"steps":[],"tags":[]}. '
                    'type must be one of: Dinner, Breakfast, Snack, Dessert, Salad, Both. '
                    'If no recipe found, return: {"error":"No recipe found"}. '
                    'Webpage text: ' + clean
                )
                text = self._call_gemini(import_prompt, max_tokens=1500, temperature=0.3)
                print(f"  Import response: {text[:100]}...")
                self._json(200, {"text": text})

            else:
                self.send_response(404)
                self.end_headers()

        except urllib.error.HTTPError as e:
            err = e.read().decode()
            print("GEMINI ERROR:", err)
            self._json(e.code, {"error": err})
        except Exception as ex:
            print("POST error:", ex)
            try: self._json(500, {"error": str(ex)})
            except: pass

    def _json(self, code, obj):
        try:
            data = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.cors()
            self.end_headers()
            self.wfile.write(data)
        except: pass

os.chdir(Path(__file__).parent)
print()
print("=" * 45)
print("  Recipe Vault - Ready!")
print(f"  Gemini: gemini-2.5-flash")
print(f"  Open: http://127.0.0.1:{PORT}")
print("  Ctrl+C to stop")
print("=" * 45)
print()
try:
    server = http.server.HTTPServer(("127.0.0.1",