# PAL ENTERPRISE — Digital Ledger System

A full-stack, mobile-first digital ledger management system for wholesale medicine distributors. Replaces traditional paper-based record keeping with a secure, modern web application.

## 🧑‍💼 Owner

**Sudip Pal** — PAL ENTERPRISE, Wholesale Medicine Distributor

## ✨ Features

- **Shop Registration** — Sign up with DL Number, Shop Name, Phone, Doctor's Name
- **Flexible Login** — Login via DL+Phone, Shop Name, or Doctor's Name
- **Bill Management** — Add bills with digital signatures (draw or type)
- **Bill-wise Payments** — Pay against specific bills, track per-bill due/paid
- **Real-time Balance** — Auto-calculated summary (Total Bills, Paid, Balance)
- **Virtual Keyboard** — Touch-friendly keyboard for typing counter names
- **Profile Section** — View registration info and account stats
- **GPay QR Code** — Real scannable UPI QR for online payments
- **PDF Export** — Download full ledger report as PDF
- **Search & Filter** — Filter transactions by bill number, date range
- **Dark Mode** — Toggle dark/light theme
- **Responsive Design** — Mobile-first, works on all devices
- **Animated UI** — Framer Motion animations, glassmorphism, video-effect background

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 3 |
| **Animations** | Framer Motion |
| **Backend** | Node.js, Express 5 |
| **Database** | JSON (primary), PostgreSQL (optional) |
| **Auth** | JWT (JSON Web Tokens) |
| **QR Code** | qrcode.react |
| **PDF** | jsPDF |
| **Signature** | react-signature-canvas |

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- npm

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🌐 Deployment

### Frontend → Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set **Base directory**: `frontend`
4. Set **Build command**: `npm run build`
5. Set **Publish directory**: `frontend/dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

The `netlify.toml` and `public/_redirects` handle SPA routing automatically.

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on Render
3. Set **Root directory**: `backend`
4. Set **Build command**: `npm install`
5. Set **Start command**: `node server.js`
6. Add environment variables:
   - `JWT_SECRET` — generate a strong secret
   - `CORS_ORIGINS` — your Netlify URL (e.g. `https://your-app.netlify.app`)
   - `PORT` — `5000`

The `render.yaml` provides a blueprint for auto-deploy.

### PostgreSQL (Optional)

Set these env vars in Render to enable auto-migration from JSON:

```
PG_HOST=your-host
PG_PORT=5432
PG_USER=your-user
PG_PASSWORD=your-password
PG_DATABASE=pal_enterprise
```

## 📁 Project Structure

```
Digital_ledger/
├── backend/
│   ├── server.js              # Express server entry
│   ├── .env                   # Environment variables
│   ├── .env.example           # Template
│   ├── data/                  # JSON database files
│   │   ├── users.json
│   │   └── transactions.json
│   └── src/
│       ├── controllers/
│       │   ├── authController.js
│       │   └── transactionController.js
│       ├── database/
│       │   ├── jsonDb.js       # JSON file database
│       │   └── pgDb.js         # PostgreSQL integration
│       ├── middleware/
│       │   └── auth.js         # JWT middleware
│       └── routes/
│           └── index.js        # API router
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css           # Video-effect background + themes
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/
│   │   │   └── VirtualKeyboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── services/
│   │       └── api.js
│   └── public/
│       ├── owner.svg           # Owner portrait placeholder
│       └── _redirects          # Netlify SPA routing
├── netlify.toml                # Netlify config
├── render.yaml                 # Render config
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/signup` | No | Register new shop |
| POST | `/api/login` | No | Login (DL+Phone / ShopName / DoctorName) |
| POST | `/api/add-entry` | JWT | Add a bill entry |
| POST | `/api/add-payment` | JWT | Pay against a specific bill |
| POST | `/api/add-payment/confirm` | JWT | Confirm overpayment |
| GET | `/api/transactions/:dl` | JWT | Get all transactions + bill-wise |
| GET | `/api/summary/:dl` | JWT | Get summary + bill-wise breakdown |

## 📸 Owner Photo

Replace the placeholder at `frontend/public/owner.svg` with your actual photo:

1. Save your photo as `frontend/public/owner.jpg` (or `.png`)
2. Update `src="/owner.svg"` to `src="/owner.jpg"` in `LandingPage.jsx`

## 📄 License

© 2026 PAL ENTERPRISE. All rights reserved.
