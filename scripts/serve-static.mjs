import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllMembers,
  getMemberById,
  saveMember,
  deleteMember,
  resetMembers,
  getAllMemories,
  saveMemory,
  deleteMemory,
  getAllTeachers,
  saveTeacher,
  deleteTeacher,
  getAllMessages,
  saveMessage,
  deleteMessage,
  toggleLikeMessage,
} from '../server/db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../out/');
const publicDir = path.resolve(__dirname, '../public/');
const uploadsDir = path.resolve(publicDir, 'uploads');
const outUploadsDir = path.resolve(root, 'uploads');

[uploadsDir, outUploadsDir].forEach((dir) => {
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch {}
  }
});

const port = Number(process.env.PORT || 3066);
if (!existsSync(path.join(root, 'index.html'))) {
  console.warn('⚠️ ยังไม่พบโฟลเดอร์ out/index.html (หากเป็น production กรุณารัน npm run build ก่อน)');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 30 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  let urlObj;
  let pathname;
  try {
    urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = decodeURIComponent(urlObj.pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  // -------------------------------------------------------------
  // API Endpoints (PostgreSQL Database)
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Members API
      if (pathname === '/api/members' || pathname.startsWith('/api/members/')) {
        const idFromPath = pathname.replace(/^\/api\/members\/?/, '').trim();

        if (req.method === 'GET') {
          if (idFromPath) {
            const member = await getMemberById(idFromPath);
            if (!member) return sendJson(res, 404, { success: false, error: 'Member not found' });
            return sendJson(res, 200, { success: true, data: member });
          }
          const members = await getAllMembers();
          return sendJson(res, 200, { success: true, data: members });
        }

        if (req.method === 'POST') {
          if (idFromPath === 'reset') {
            const list = await resetMembers();
            return sendJson(res, 200, { success: true, data: list, message: 'Reset successfully' });
          }
          const body = await readBody(req);
          if (!body || !body.nickname) {
            return sendJson(res, 400, { success: false, error: 'Nickname is required' });
          }
          const saved = await saveMember(body);
          const all = await getAllMembers();
          return sendJson(res, 200, { success: true, data: saved, list: all });
        }

        if (req.method === 'DELETE') {
          const body = req.headers['content-length'] ? await readBody(req).catch(() => ({})) : {};
          const id = idFromPath || body.id || urlObj.searchParams.get('id');
          if (!id) return sendJson(res, 400, { success: false, error: 'Member ID required' });
          const deleted = await deleteMember(id);
          const all = await getAllMembers();
          return sendJson(res, 200, { success: deleted, list: all });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 2. Memories API
      if (pathname === '/api/memories' || pathname.startsWith('/api/memories/')) {
        const idFromPath = pathname.replace(/^\/api\/memories\/?/, '').trim();

        if (req.method === 'GET') {
          const memories = await getAllMemories();
          return sendJson(res, 200, { success: true, data: memories });
        }

        if (req.method === 'POST') {
          const body = await readBody(req);
          if (!body || !body.image) {
            return sendJson(res, 400, { success: false, error: 'Image is required' });
          }
          const saved = await saveMemory(body);
          const all = await getAllMemories();
          return sendJson(res, 200, { success: true, data: saved, list: all });
        }

        if (req.method === 'DELETE') {
          const body = req.headers['content-length'] ? await readBody(req).catch(() => ({})) : {};
          const id = idFromPath || body.id || urlObj.searchParams.get('id');
          if (!id) return sendJson(res, 400, { success: false, error: 'Memory ID required' });
          const deleted = await deleteMemory(id);
          const all = await getAllMemories();
          return sendJson(res, 200, { success: deleted, list: all });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 3. Teachers API
      if (pathname === '/api/teachers' || pathname.startsWith('/api/teachers/')) {
        const idFromPath = pathname.replace(/^\/api\/teachers\/?/, '').trim();

        if (req.method === 'GET') {
          const teachers = await getAllTeachers();
          return sendJson(res, 200, { success: true, data: teachers });
        }

        if (req.method === 'POST') {
          const body = await readBody(req);
          if (!body || !body.fullname) {
            return sendJson(res, 400, { success: false, error: 'Fullname is required' });
          }
          const saved = await saveTeacher(body);
          const all = await getAllTeachers();
          return sendJson(res, 200, { success: true, data: saved, list: all });
        }

        if (req.method === 'DELETE') {
          const body = req.headers['content-length'] ? await readBody(req).catch(() => ({})) : {};
          const id = idFromPath || body.id || urlObj.searchParams.get('id');
          if (!id) return sendJson(res, 400, { success: false, error: 'Teacher ID required' });
          const deleted = await deleteTeacher(id);
          const all = await getAllTeachers();
          return sendJson(res, 200, { success: deleted, list: all });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 4. Messages API
      if (pathname === '/api/messages' || pathname.startsWith('/api/messages/')) {
        const idFromPath = pathname.replace(/^\/api\/messages\/?/, '').trim();

        if (req.method === 'GET') {
          const messages = await getAllMessages();
          return sendJson(res, 200, { success: true, data: messages });
        }

        if (req.method === 'POST') {
          if (idFromPath.endsWith('/like') || pathname.endsWith('/like')) {
            const likeId = idFromPath.replace(/\/like$/, '');
            const liked = await toggleLikeMessage(likeId);
            const all = await getAllMessages();
            return sendJson(res, 200, { success: Boolean(liked), data: liked, list: all });
          }

          const body = await readBody(req);
          if (!body || !body.content || !body.senderName) {
            return sendJson(res, 400, { success: false, error: 'Sender name and content are required' });
          }
          const saved = await saveMessage(body);
          const all = await getAllMessages();
          return sendJson(res, 200, { success: true, data: saved, list: all });
        }

        if (req.method === 'DELETE') {
          const body = req.headers['content-length'] ? await readBody(req).catch(() => ({})) : {};
          const id = idFromPath || body.id || urlObj.searchParams.get('id');
          if (!id) return sendJson(res, 400, { success: false, error: 'Message ID required' });
          const deleted = await deleteMessage(id);
          const all = await getAllMessages();
          return sendJson(res, 200, { success: deleted, list: all });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 3. Upload Image API
      if (pathname === '/api/upload' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.image) {
          return sendJson(res, 400, { success: false, error: 'Image data is required' });
        }

        // Support data:image/png;base64,...
        const match = body.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const rawExt = match[1].toLowerCase().replace('jpeg', 'jpg');
          const ext = ['.jpg', '.png', '.webp', '.svg'].includes('.' + rawExt) ? rawExt : 'jpg';
          const buffer = Buffer.from(match[2], 'base64');
          const filename = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

          [uploadsDir, outUploadsDir].forEach((dir) => {
            try {
              if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
              writeFileSync(path.join(dir, filename), buffer);
            } catch (e) {
              console.error('Failed to write upload:', e.message);
            }
          });

          return sendJson(res, 200, { success: true, url: `/uploads/${filename}` });
        }

        // If it's already a URL, return as is
        return sendJson(res, 200, { success: true, url: body.image });
      }

      return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
    } catch (err) {
      console.error('[API Error]', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
    }
  }

  // -------------------------------------------------------------
  // Static File Server
  // -------------------------------------------------------------
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  try {
    if (pathname.includes('\0') || pathname.includes('\\')) {
      res.writeHead(400);
      res.end();
      return;
    }

    // Serve /uploads/* from uploadsDir if available
    if (pathname.startsWith('/uploads/')) {
      const uploadFile = path.resolve(uploadsDir, '.' + pathname.replace('/uploads', ''));
      if (await stat(uploadFile).then((info) => info.isFile()).catch(() => false)) {
        const info = await stat(uploadFile);
        res.writeHead(200, {
          'Content-Type': mime[path.extname(uploadFile)] || 'application/octet-stream',
          'Content-Length': info.size,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, max-age=31536000',
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        createReadStream(uploadFile).on('error', () => res.destroy()).pipe(res);
        return;
      }
    }

    const target = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403);
      res.end();
      return;
    }

    let file;
    for (const candidate of [target, target + '.html', path.join(target, 'index.html')]) {
      if (await stat(candidate).then((info) => info.isFile()).catch(() => false)) {
        file = candidate;
        break;
      }
    }

    const status = file ? 200 : 404;
    file ||= path.join(root, '404.html');

    if (!(await stat(file).then((i) => i.isFile()).catch(() => false))) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const info = await stat(file);
    res.writeHead(status, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(400);
    res.end();
  }
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => {
  const actualPort = server.address()?.port || port;
  console.log(`==========================================`);
  console.log(`🚀 CS66 Server (PostgreSQL + Full API) Ready!`);
  console.log(`🌐 Local URL:  http://127.0.0.1:${actualPort}`);
  console.log(`🗄️ Database:   PostgreSQL (CS66 @ 100.70.251.65:5432)`);
  console.log(`==========================================`);
});
