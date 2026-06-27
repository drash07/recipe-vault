import http.server, json, urllib.request, urllib.error, os
import re, json as _json
from pathlib import Path

PORT = 8080

def load_env():
    env = {}
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

ENV = load_env()
GEMINI_KEY = ENV.get('GEMINI_KEY', '')
SUPABASE_URL = ENV.get('SUPABASE_URL', '')
SUPABASE_KEY = ENV.get('SUPABASE_KEY', '')
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

if not GEMINI_KEY:
    print("WARNING: GEMINI_KEY not found in .env")
if not SUPABASE_URL:
    print("WARNING: SUPABASE_URL not found in .env")

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

            if Path(fp).name == "index.html":
                data = Path(fp).read_text(encoding="utf-8")
                data = data.replace("__GEMINI_KEY__", GEMINI_KEY)
                data = data.replace("__SUPABASE_URL__", SUPABASE_URL)
                data = data.replace("__SUPABASE_KEY__", SUPABASE_KEY)
                data = data.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.send_header("Content-Length", str(len(data)))
                self.cors()
                self.end_headers()
                self.wfile.write(data)
                return

            data = open(fp, "rb").read()
            mime = {".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png"}.get(Path(fp).suffix, "application/octet-stream")
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

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body_raw = self.rfile.read(length)

            if self.path == "/api/fetch-url":
                req_data = json.loads(body_raw)
                url = req_data.get("url", "")
                if not url.startswith("http"):
                    self._json(400, {"error": "Invalid URL"}); return
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=15) as r:
                        raw = r.read().decode("utf-8", errors="ignore")
                    # Strip script/style tags and HTML tags
                    raw = re.sub(r'<(script|style)[^>]*>.*?</(script|style)>', ' ', raw, flags=re.DOTALL|re.IGNORECASE)
                    raw = re.sub(r'<[^>]+>', ' ', raw)
                    raw = re.sub(r'[ \t]+', ' ', raw)
                    raw = re.sub(r'\n{3,}', '\n\n', raw).strip()
                    print(f"  Fetched URL: {url[:60]} ({len(raw)} chars)")
                    self._json(200, {"text": raw[:8000]})
                except Exception as ex:
                    print(f"  Fetch error: {ex}")
                    self._json(500, {"error": str(ex)})

            elif self.path == "/api/ai":
                req_data = json.loads(body_raw)
                prompt = req_data.get("prompt", "")
                max_tokens = req_data.get("maxTokens", 1200)

                print(f"  AI request: {prompt[:80]}...")

                gemini_body = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7}
                }).encode()

                req = urllib.request.Request(
                    GEMINI_URL,
                    data=gemini_body,
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
                print(f"  AI response: {text[:100]}...")
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
print(f"  Gemini: gemini-2.0-flash (1500 req/day)")
print(f"  Open: http://localhost:{PORT}")
print("  Ctrl+C to stop")
print("=" * 45)
print()
http.server.HTTPServer(("", PORT), H).serve_forever()
