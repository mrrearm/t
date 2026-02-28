const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database setup ──────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "journal.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    headline    TEXT NOT NULL,
    deck        TEXT,
    author      TEXT,
    category    TEXT DEFAULT 'EXCLUSIVE',
    body        TEXT,
    date        TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
`);

console.log(`📰 Database ready at: ${DB_PATH}`);

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ──────────────────────────────────────────────────────

// GET all posts
app.get("/api/posts", (req, res) => {
  try {
    const { search, category } = req.query;
    let query = "SELECT * FROM posts";
    const params = [];
    const conditions = [];

    if (category && category !== "ALL") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search) {
      conditions.push("(headline LIKE ? OR body LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY date DESC";

    const posts = db.prepare(query).all(...params);
    res.json({ ok: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET single post
app.get("/api/posts/:id", (req, res) => {
  try {
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
    if (!post) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, post });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST create post
app.post("/api/posts", (req, res) => {
  try {
    const { headline, deck, author, category, body } = req.body;
    if (!headline?.trim()) return res.status(400).json({ ok: false, error: "Headline required" });
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO posts (id, headline, deck, author, category, body, date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, headline, deck || "", author || "", category || "EXCLUSIVE", body || "", now, now);
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.status(201).json({ ok: true, post });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT update post
app.put("/api/posts/:id", (req, res) => {
  try {
    const { headline, deck, author, category, body } = req.body;
    if (!headline?.trim()) return res.status(400).json({ ok: false, error: "Headline required" });
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE posts SET headline=?, deck=?, author=?, category=?, body=?, updated_at=?
      WHERE id=?
    `).run(headline, deck || "", author || "", category || "EXCLUSIVE", body || "", now, req.params.id);
    if (!result.changes) return res.status(404).json({ ok: false, error: "Not found" });
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
    res.json({ ok: true, post });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE post
app.delete("/api/posts/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET stats
app.get("/api/stats", (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as n FROM posts").get().n;
    const byCategory = db.prepare("SELECT category, COUNT(*) as n FROM posts GROUP BY category ORDER BY n DESC").all();
    const latest = db.prepare("SELECT date FROM posts ORDER BY date DESC LIMIT 1").get();
    res.json({ ok: true, total, byCategory, latestDate: latest?.date });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Fallback → serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📰 The Daily Journal running on http://localhost:${PORT}`);
});
