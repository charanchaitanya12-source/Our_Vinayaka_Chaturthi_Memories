/**
 * ============================================================================
 * VINAYAKA CHATURTHI MEMORIES - CLOUD & STATIC HTTP SERVER
 * ============================================================================
 * Production server for Render and Node environments.
 * 
 * Features:
 * - High performance zero-dependency static file server with Range request support (audio/video).
 * - RESTful Cloud API for Memory Wall:
 *   - GET /api/memories             -> Returns all memories (newest first)
 *   - POST /api/memories            -> Adds new memory, broadcasts to all connected devices
 *   - POST /api/memories/:id/like   -> Increments like count, broadcasts to all connected devices
 *   - DELETE /api/memories/:id      -> Admin moderation delete (requires x-admin-passcode)
 *   - GET /api/memories/stream      -> Server-Sent Events (SSE) live real-time sync stream
 * - Thread-safe JSON file persistence in data/memories.json.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = path.join(__dirname, 'data');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'chaturthi2026';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed default initial memories if file doesn't exist
if (!fs.existsSync(MEMORIES_FILE)) {
  const initialMemories = [
    {
      id: 'mem_init_1',
      name: 'Charan & Gang',
      author: 'Charan & Gang',
      relation: 'Street Family',
      role: 'Street Family',
      memoryType: 'Favorite Moment',
      category: 'Favorite Moment',
      sticker: '🙏',
      message: 'ఈ ఉత్సవం మన గల్లీలో తెచ్చిన ఆనందం, మన స్నేహం ఎప్పటికీ చిరస్మరణీయం! గణపతి బప్పా మోరియా! Wishing peace, unity, and endless happiness to everyone who celebrated with us.',
      photo: null,
      photo_url: null,
      createdAt: Date.now() - 3600000 * 24 * 2,
      date: 'Sep 4, 2026',
      likes: 12
    },
    {
      id: 'mem_init_2',
      name: 'Pandal Youth',
      author: 'Pandal Youth',
      relation: 'The Gang',
      role: 'The Gang',
      memoryType: 'Funniest Incident',
      category: 'Funniest Incident',
      sticker: '🥁',
      message: 'నిమజ్జనం రోజు డప్పుల మోత, తీన్‌మార్ డాన్సులు, గల్లీ మొత్తం ఒకే కుటుంబంలా ఆడిన ఆటలు ఎప్పటికీ మర్చిపోలేము! Ganpati Bappa Morya!',
      photo: null,
      photo_url: null,
      createdAt: Date.now() - 3600000 * 12,
      date: 'Sep 6, 2026',
      likes: 8
    }
  ];
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify(initialMemories, null, 2), 'utf-8');
}

// Active Server-Sent Events client connections
const sseClients = new Set();

function broadcastToClients(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function loadMemories() {
  try {
    if (!fs.existsSync(MEMORIES_FILE)) return [];
    const content = fs.readFileSync(MEMORIES_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading memories.json:', err);
    return [];
  }
}

function saveMemories(memories) {
  try {
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing memories.json:', err);
    return false;
  }
}

// MIME types lookup
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Set global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-passcode');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* =========================================================================
     API ROUTES: /api/memories
     ========================================================================= */

  // 1. GET /api/memories/stream (Server-Sent Events for Realtime Multi-Device Sync)
  if (pathname === '/api/memories/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: sseClients.size + 1 })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. GET /api/memories
  if (pathname === '/api/memories' && req.method === 'GET') {
    const memories = loadMemories();
    // Sort newest first: createdAt DESC
    memories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: memories.length, memories }));
    return;
  }

  // 3. POST /api/memories
  if (pathname === '/api/memories' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 15MB safety limit
      if (body.length > 15 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const rawMessage = (payload.message || '').trim();

        if (!rawMessage || rawMessage.length < 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Message is required (min 3 characters).' }));
          return;
        }

        const now = Date.now();
        const authorName = (payload.name || payload.author || '').trim() || 'గల్లీ మిత్రుడు (Well Wisher)';
        const authorRole = (payload.relation || payload.role || '').trim() || 'Street Family';
        const memoryCategory = (payload.memoryType || payload.category || '').trim() || 'Favorite Moment';
        const sticker = payload.sticker || '🙏';
        const photo = payload.photo || payload.photo_url || null;

        const newMemory = {
          id: 'mem_' + now + '_' + Math.random().toString(36).substr(2, 6),
          name: authorName,
          author: authorName,
          relation: authorRole,
          role: authorRole,
          memoryType: memoryCategory,
          category: memoryCategory,
          sticker: sticker,
          message: rawMessage,
          photo: photo,
          photo_url: photo,
          createdAt: now,
          date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          likes: 0
        };

        const memories = loadMemories();
        memories.unshift(newMemory);
        saveMemories(memories);

        // Broadcast to all other devices in real time
        broadcastToClients('memory_added', newMemory);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, memory: newMemory }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload.' }));
      }
    });
    return;
  }

  // 4. POST /api/memories/:id/like
  const likeMatch = pathname.match(/^\/api\/memories\/([a-zA-Z0-9_\-]+)\/like$/);
  if (likeMatch && req.method === 'POST') {
    const memoryId = likeMatch[1];
    const memories = loadMemories();
    const target = memories.find(m => m.id === memoryId);

    if (!target) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Memory not found.' }));
      return;
    }

    target.likes = (target.likes || 0) + 1;
    saveMemories(memories);

    // Broadcast updated like count to all devices
    broadcastToClients('memory_liked', { id: memoryId, likes: target.likes });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, id: memoryId, likes: target.likes }));
    return;
  }

  // 5. DELETE /api/memories/:id (Admin Moderation)
  const deleteMatch = pathname.match(/^\/api\/memories\/([a-zA-Z0-9_\-]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Admin passcode required.' }));
      return;
    }

    const memoryId = deleteMatch[1];
    let memories = loadMemories();
    const initialLen = memories.length;
    memories = memories.filter(m => m.id !== memoryId);

    if (memories.length === initialLen) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Memory not found.' }));
      return;
    }

    saveMemories(memories);
    broadcastToClients('memory_deleted', { id: memoryId });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, id: memoryId }));
    return;
  }

  /* =========================================================================
     STATIC FILE SERVING
     ========================================================================= */

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    // Handle Range Requests for Audio/Video streaming
    const rangeHeader = req.headers.range;
    if (rangeHeader && (ext === '.mp3' || ext === '.mp4')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        res.end();
        return;
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🪔 Vinayaka Chaturthi Time Capsule server running at http://localhost:${PORT}`);
  console.log(`📡 Realtime Memory Wall API listening on http://localhost:${PORT}/api/memories`);
});
