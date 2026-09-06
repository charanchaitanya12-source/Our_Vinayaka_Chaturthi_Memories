"""
Local Development Server in Python matching server.js API.
Provides static serving + /api/memories CRUD + SSE for local testing.
"""
import os
import sys
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MEMORIES_FILE = os.path.join(DATA_DIR, 'memories.json')
ADMIN_PASSCODE = 'chaturthi2026'

os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(MEMORIES_FILE):
    initial = [
        {
            "id": "mem_init_1",
            "name": "Charan & Gang",
            "author": "Charan & Gang",
            "relation": "Street Family",
            "role": "Street Family",
            "memoryType": "Favorite Moment",
            "category": "Favorite Moment",
            "sticker": "🙏",
            "message": "ఈ ఉత్సవం మన గల్లీలో తెచ్చిన ఆనందం, మన స్నేహం ఎప్పటికీ చిరస్మరణీయం! గణపతి బప్పా మోరియా! Wishing peace, unity, and endless happiness to everyone who celebrated with us.",
            "photo": None,
            "photo_url": None,
            "createdAt": int(time.time() * 1000) - 3600000 * 24 * 2,
            "date": "Sep 4, 2026",
            "likes": 12
        }
    ]
    with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(initial, f, indent=2, ensure_ascii=False)

def read_memories():
    try:
        with open(MEMORIES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_memories(memories):
    try:
        with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(memories, f, indent=2, ensure_ascii=False)
        return True
    except:
        return False

class DevHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, x-admin-passcode')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/memories':
            memories = read_memories()
            memories.sort(key=lambda x: x.get('createdAt', 0), reverse=True)
            payload = json.dumps({"success": True, "count": len(memories), "memories": memories}, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/memories':
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len).decode('utf-8')
            try:
                data = json.loads(post_body)
            except:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"success": false, "message": "Invalid JSON"}')
                return

            now = int(time.time() * 1000)
            author = data.get('name') or data.get('author') or 'గల్లీ మిత్రుడు (Well Wisher)'
            role = data.get('relation') or data.get('role') or 'Street Family'
            cat = data.get('memoryType') or data.get('category') or 'Favorite Moment'
            msg = (data.get('message') or '').strip()

            if not msg or len(msg) < 3:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"success": false, "message": "Message too short"}')
                return

            new_mem = {
                "id": f"mem_{now}_{os.urandom(3).hex()}",
                "name": author,
                "author": author,
                "relation": role,
                "role": role,
                "memoryType": cat,
                "category": cat,
                "sticker": data.get('sticker') or '🙏',
                "message": msg,
                "photo": data.get('photo') or data.get('photo_url'),
                "photo_url": data.get('photo') or data.get('photo_url'),
                "createdAt": now,
                "date": "Just Now • ఇప్పుడే",
                "likes": 0
            }

            mems = read_memories()
            mems.insert(0, new_mem)
            write_memories(mems)

            res_payload = json.dumps({"success": True, "memory": new_mem}, ensure_ascii=False).encode('utf-8')
            self.send_response(201)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(res_payload)))
            self.end_headers()
            self.wfile.write(res_payload)
            return

        if parsed.path.startswith('/api/memories/') and parsed.path.endswith('/like'):
            parts = parsed.path.split('/')
            mem_id = parts[3]
            mems = read_memories()
            found = None
            for m in mems:
                if m.get('id') == mem_id:
                    m['likes'] = m.get('likes', 0) + 1
                    found = m
                    break
            if found:
                write_memories(mems)
                res_payload = json.dumps({"success": True, "id": mem_id, "likes": found['likes']}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(res_payload)))
                self.end_headers()
                self.wfile.write(res_payload)
                return
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'{"success": false, "message": "Not found"}')
                return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/api/memories/'):
            mem_id = parsed.path.split('/')[3]
            passcode = self.headers.get('x-admin-passcode')
            if passcode != ADMIN_PASSCODE:
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b'{"success": false, "message": "Admin passcode required"}')
                return

            mems = read_memories()
            init_len = len(mems)
            mems = [m for m in mems if m.get('id') != mem_id]
            if len(mems) < init_len:
                write_memories(mems)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"success": true}')
                return
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'{"success": false, "message": "Not found"}')
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), DevHandler)
    print(f"Dev server running on port {PORT}")
    server.serve_forever()
