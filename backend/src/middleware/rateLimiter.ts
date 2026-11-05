// ============================================================
// d:\ABHAYA\backend\src\middleware\rateLimiter.ts
// Rate limiters for API, auth, and SOS endpoints
// ============================================================

import rateLimit from 'express-rate-limit';

/** General API limiter: 100 requests per 15 minutes */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/** Auth endpoints limiter: 10 requests per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/** SOS endpoint limiter: 5 requests per minute */
export const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many SOS activations. Please wait before trying again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/** Community post limiter: 10 posts per hour */
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Post limit reached. You can post up to 10 times per hour.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
