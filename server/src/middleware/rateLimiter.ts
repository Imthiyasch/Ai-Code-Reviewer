import rateLimit from 'express-rate-limit';

// 10 reviews per hour per IP / user
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. You can submit up to 10 reviews per hour.',
  },
  keyGenerator: (req: any) => req.user?.id ?? req.ip,
});

// General API rate limit (60 req/min)
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
