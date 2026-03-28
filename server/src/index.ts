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

// ─── Vercel / Proxy setup ────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── Request Logger ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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
app.get('/api/health', (_req, res) => res.json({ 
  status: 'ok', 
  env: process.env.NODE_ENV,
  db: !!process.env.DATABASE_URL,
  vercel: !!process.env.VERCEL
}));

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('🔥 Global error caught:', err.message || err);
  if (err.stack) console.error(err.stack);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' || !process.env.VERCEL ? err.stack : undefined
  });
});

// ─── Export for Vercel ───────────────────────────────────────────────────
export default app;

// ─── Start ────────────────────────────────────────────────────────────────
// In Vercel, this file is imported and exported as a serverless function.
// We only run the server and migrations in non-Vercel environments (or local dev).
const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;

if (!isVercel) {
  runMigrations()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server/migrations:', err);
      process.exit(1);
    });
}
