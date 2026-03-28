import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalRateLimiter } from './middleware/rateLimiter';
import authRouter from './routes/auth';
import reviewsRouter from './routes/reviews';
import adminRouter from './routes/admin';
import { runMigrations } from './db/client';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.VITE_APP_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Body parser ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api/', generalRateLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);

// ─── Health ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Export for Vercel ───────────────────────────────────────────────────
export default app;

// ─── Start ────────────────────────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
    // Vercel handles the serverless execution, so only listen during local dev or non-Vercel envs
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    if (!process.env.VERCEL) process.exit(1);
  }
}

start();
