# 📰 The Daily Journal

**Stack: Node.js puro — ZERO dipendenze npm**

Il server usa solo moduli built-in di Node.js (`http`, `fs`, `path`, `crypto`).
Non serve `npm install`. Non può fallire per dipendenze mancanti.

---

## 🚀 Deploy su Railway (3 passi)

**1.** Carica la cartella su GitHub:
```bash
git init
git add .
git commit -m "first deploy"
# crea repo su github.com, poi:
git remote add origin https://github.com/TUO-NOME/journal.git
git push -u origin main
```

**2.** Vai su [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → seleziona il repo

**3.** Railway legge il `package.json`, esegue `node server.js` → URL pubblico in ~30 secondi ✅

---

## 🟢 Deploy su Render

1. [render.com](https://render.com) → New Web Service → collega GitHub
2. **Start Command:** `node server.js`
3. **Build Command:** *(lascia vuoto)*

---

## 💻 In locale

```bash
node server.js
# → http://localhost:3000
```

Nessun `npm install` necessario.

---

## 🔌 API REST

| Metodo | URL | Descrizione |
|--------|-----|-------------|
| GET | `/api/posts` | Lista post |
| GET | `/api/posts?category=WORLD` | Filtra |
| GET | `/api/posts?search=testo` | Cerca |
| POST | `/api/posts` | Crea |
| PUT | `/api/posts/:id` | Modifica |
| DELETE | `/api/posts/:id` | Elimina |
| GET | `/api/stats` | Statistiche |
