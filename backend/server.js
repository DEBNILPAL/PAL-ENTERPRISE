require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const { initPostgres } = require('./src/database/pgDb');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
// CORS: allow deployed Netlify frontend + localhost for development
const allowedOrigins = [
  'https://palenterprise.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
];
// Add any custom origins from env var
if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Also allow any *.netlify.app subdomain
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    console.log('[CORS] Blocked origin:', origin);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Allow large payloads for signatures

// Basic rate limiting (simple in-memory)
const rateLimit = {};
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter((ts) => now - ts < 60000); // 1 minute window
  if (rateLimit[ip].length > 100) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  rateLimit[ip].push(now);
  next();
});

// ---------- Routes ----------
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'PAL ENTERPRISE Digital Ledger API',
    status: 'running',
    version: '1.0.0',
  });
});

// ---------- Start ----------
async function start() {
  // Attempt PostgreSQL connection (non-blocking – falls back to JSON)
  await initPostgres();

  app.listen(PORT, () => {
    console.log(`\n🚀 PAL ENTERPRISE Backend running on http://localhost:${PORT}`);
    console.log(`📁 API Base: http://localhost:${PORT}/api\n`);
  });
}

start();
