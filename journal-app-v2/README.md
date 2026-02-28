# 📰 The Daily Journal — Backend

Stack: **Node.js + Express + JSON file database** (zero dipendenze native, deploy ovunque)

---

## 🚀 Deploy su Railway

### Metodo 1 — GitHub (consigliato)
1. Crea un repo su GitHub e carica questi file
2. Vai su [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Seleziona il repo → il deploy parte automaticamente
4. In 1-2 minuti hai l'URL pubblico

### Metodo 2 — CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## 🟢 Deploy su Render

1. Vai su [render.com](https://render.com) → **New Web Service**
2. Collega il repo GitHub
3. Impostazioni:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node

---

## 💻 Locale

```bash
npm install
node server.js
# → http://localhost:3000
```

---

## 🔌 API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/posts` | Tutti i post |
| GET | `/api/posts?category=WORLD` | Per categoria |
| GET | `/api/posts?search=testo` | Ricerca |
| GET | `/api/posts/:id` | Post singolo |
| POST | `/api/posts` | Crea post |
| PUT | `/api/posts/:id` | Modifica post |
| DELETE | `/api/posts/:id` | Elimina post |
| GET | `/api/stats` | Statistiche |

---

## 📁 Struttura

```
journal-app/
├── server.js        ← Express API + JSON DB
├── public/
│   └── index.html   ← Frontend React
├── package.json
├── railway.toml     ← Config Railway
└── db.json          ← Database (auto-creato)
```
