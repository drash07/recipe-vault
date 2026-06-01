import http.server, json, urllib.request, urllib.error, os
import re, json as _json
from pathlib import Path

PORT = 8080
GEMINI_KEY = "YOUR_GEMINI_KEY_HERE"  # replace with your actual key when running locally
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

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

            if self.path == "/api/ai":
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
