// ─────────────────────────────────────────────────────────────────────────────
//  The Daily Journal — Server
//  Zero external dependencies. Uses only Node.js built-ins: http, fs, path, crypto
// ─────────────────────────────────────────────────────────────────────────────
const http   = require("http");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const PORT    = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "db.json");
const PUBLIC  = path.join(__dirname, "public");

// ── DB helpers ────────────────────────────────────────────────────────────────
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch (_) { return { posts: [] }; }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
if (!fs.existsSync(DB_FILE)) writeDB({ posts: [] });

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".ico":  "image/x-icon",
};

// ── Read request body ─────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", c => { data += c; });
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
  });
}

// ── Response helpers ──────────────────────────────────────────────────────────
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type":  "application/json",
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // fallback to index.html for SPA routing
      fs.readFile(path.join(PUBLIC, "index.html"), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

// ── Router ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url    = req.url.split("?")[0].replace(/\/$/, "") || "/";
  const qs     = Object.fromEntries(new URLSearchParams(req.url.split("?")[1] || ""));
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // ── GET /api/posts ──────────────────────────────────────────────────────────
  if (method === "GET" && url === "/api/posts") {
    let { posts } = readDB();
    if (qs.category && qs.category !== "ALL")
      posts = posts.filter(p => p.category === qs.category);
    if (qs.search) {
      const q = qs.search.toLowerCase();
      posts = posts.filter(p =>
        p.headline.toLowerCase().includes(q) ||
        (p.body || "").toLowerCase().includes(q)
      );
    }
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return json(res, 200, { ok: true, posts });
  }

  // ── GET /api/posts/:id ──────────────────────────────────────────────────────
  const matchId = url.match(/^\/api\/posts\/([^/]+)$/);
  if (method === "GET" && matchId) {
    const post = readDB().posts.find(p => p.id === matchId[1]);
    if (!post) return json(res, 404, { ok: false, error: "Not found" });
    return json(res, 200, { ok: true, post });
  }

  // ── POST /api/posts ─────────────────────────────────────────────────────────
  if (method === "POST" && url === "/api/posts") {
    const body = await readBody(req);
    if (!body.headline?.trim()) return json(res, 400, { ok: false, error: "Headline required" });
    const now  = new Date().toISOString();
    const post = {
      id:         crypto.randomUUID(),
      headline:   body.headline,
      deck:       body.deck       || "",
      author:     body.author     || "",
      category:   body.category   || "EXCLUSIVE",
      body:       body.body       || "",
      date:       now,
      updated_at: now,
    };
    const db = readDB();
    db.posts.unshift(post);
    writeDB(db);
    return json(res, 201, { ok: true, post });
  }

  // ── PUT /api/posts/:id ──────────────────────────────────────────────────────
  if (method === "PUT" && matchId) {
    const body = await readBody(req);
    if (!body.headline?.trim()) return json(res, 400, { ok: false, error: "Headline required" });
    const db  = readDB();
    const idx = db.posts.findIndex(p => p.id === matchId[1]);
    if (idx === -1) return json(res, 404, { ok: false, error: "Not found" });
    db.posts[idx] = {
      ...db.posts[idx],
      headline:   body.headline,
      deck:       body.deck     || "",
      author:     body.author   || "",
      category:   body.category || "EXCLUSIVE",
      body:       body.body     || "",
      updated_at: new Date().toISOString(),
    };
    writeDB(db);
    return json(res, 200, { ok: true, post: db.posts[idx] });
  }

  // ── DELETE /api/posts/:id ───────────────────────────────────────────────────
  if (method === "DELETE" && matchId) {
    const db  = readDB();
    const len = db.posts.length;
    db.posts  = db.posts.filter(p => p.id !== matchId[1]);
    if (db.posts.length === len) return json(res, 404, { ok: false, error: "Not found" });
    writeDB(db);
    return json(res, 200, { ok: true });
  }

  // ── GET /api/stats ──────────────────────────────────────────────────────────
  if (method === "GET" && url === "/api/stats") {
    const { posts } = readDB();
    const map = {};
    posts.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    const byCategory = Object.entries(map)
      .map(([category, n]) => ({ category, n }))
      .sort((a, b) => b.n - a.n);
    return json(res, 200, { ok: true, total: posts.length, byCategory });
  }

  // ── Static files ────────────────────────────────────────────────────────────
  if (method === "GET") {
    const rel = url === "/" ? "index.html" : url.slice(1);
    serveFile(res, path.join(PUBLIC, rel));
    return;
  }

  json(res, 405, { ok: false, error: "Method not allowed" });
});

server.listen(PORT, () =>
  console.log(`📰 The Daily Journal → http://localhost:${PORT}`)
);
