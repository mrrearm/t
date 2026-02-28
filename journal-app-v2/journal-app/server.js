const express = require("express");
const cors    = require("cors");
const { v4: uuidv4 } = require("uuid");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── JSON "database" ────────────────────────────────────────────────
const DB_FILE = process.env.DB_PATH || path.join(__dirname, "db.json");

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { posts: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (_) { return { posts: [] }; }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Init DB if missing
if (!fs.existsSync(DB_FILE)) writeDB({ posts: [] });
console.log(`📰 Database: ${DB_FILE}`);

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── API ────────────────────────────────────────────────────────────

// GET /api/posts  ?category=X  ?search=Y
app.get("/api/posts", (req, res) => {
  try {
    const { search, category } = req.query;
    let { posts } = readDB();

    if (category && category !== "ALL")
      posts = posts.filter(p => p.category === category);

    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.headline.toLowerCase().includes(q) ||
        (p.body || "").toLowerCase().includes(q)
      );
    }

    // newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ ok: true, posts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/posts/:id
app.get("/api/posts/:id", (req, res) => {
  const { posts } = readDB();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, post });
});

// POST /api/posts
app.post("/api/posts", (req, res) => {
  try {
    const { headline, deck, author, category, body } = req.body;
    if (!headline?.trim()) return res.status(400).json({ ok: false, error: "Headline required" });

    const now  = new Date().toISOString();
    const post = { id: uuidv4(), headline, deck: deck||"", author: author||"",
                   category: category||"EXCLUSIVE", body: body||"",
                   date: now, updated_at: now };

    const db = readDB();
    db.posts.unshift(post);
    writeDB(db);
    res.status(201).json({ ok: true, post });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/posts/:id
app.put("/api/posts/:id", (req, res) => {
  try {
    const { headline, deck, author, category, body } = req.body;
    if (!headline?.trim()) return res.status(400).json({ ok: false, error: "Headline required" });

    const db  = readDB();
    const idx = db.posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

    db.posts[idx] = { ...db.posts[idx], headline, deck: deck||"", author: author||"",
                      category: category||"EXCLUSIVE", body: body||"",
                      updated_at: new Date().toISOString() };
    writeDB(db);
    res.json({ ok: true, post: db.posts[idx] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/posts/:id
app.delete("/api/posts/:id", (req, res) => {
  try {
    const db  = readDB();
    const len = db.posts.length;
    db.posts  = db.posts.filter(p => p.id !== req.params.id);
    if (db.posts.length === len) return res.status(404).json({ ok: false, error: "Not found" });
    writeDB(db);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  try {
    const { posts } = readDB();
    const byCategory = Object.entries(
      posts.reduce((acc, p) => { acc[p.category] = (acc[p.category]||0)+1; return acc; }, {})
    ).map(([category, n]) => ({ category, n }))
     .sort((a,b) => b.n - a.n);

    res.json({ ok: true, total: posts.length, byCategory,
               latestDate: posts[0]?.date || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Fallback → frontend
app.get("*", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.listen(PORT, () =>
  console.log(`📰 The Daily Journal → http://localhost:${PORT}`)
);
