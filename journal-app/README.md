# 📰 The Daily Journal

Tabloid-style personal journaling app with Express backend + SQLite database.

---

## 🚀 Deploy su Railway (gratis, 3 minuti)

**1. Crea account su [railway.app](https://railway.app)**

**2. Crea un nuovo progetto:**
```
New Project → Deploy from GitHub repo
```
oppure installa la CLI:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**3. Railway ti darà un URL pubblico** tipo `https://journal-production.up.railway.app`

---

## 🟢 Deploy su Render (alternativa gratuita)

**1. Vai su [render.com](https://render.com) → New Web Service**

**2. Collega il tuo repo GitHub**

**3. Impostazioni:**
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `Node`

---

## 💻 Esecuzione locale

```bash
# Installa dipendenze
npm install

# Avvia il server
npm start

# Apri il browser su
http://localhost:3000
```

---

## 🔌 API Endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/posts` | Lista tutti i post |
| GET | `/api/posts?category=WORLD` | Filtra per categoria |
| GET | `/api/posts?search=testo` | Cerca nei post |
| GET | `/api/posts/:id` | Singolo post |
| POST | `/api/posts` | Crea post |
| PUT | `/api/posts/:id` | Modifica post |
| DELETE | `/api/posts/:id` | Elimina post |
| GET | `/api/stats` | Statistiche |

---

## 🗃 Struttura

```
journal-app/
├── server.js          # Express backend + SQLite
├── public/
│   └── index.html     # Frontend React (single page)
├── package.json
├── .env               # Variabili d'ambiente
└── journal.db         # Database SQLite (auto-creato)
```

---

## ⚙️ Variabili d'ambiente

```env
PORT=3000
DB_PATH=./journal.db
```
