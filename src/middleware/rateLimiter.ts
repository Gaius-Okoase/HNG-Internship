import rateLimiter from 'express-rate-limit';

export const profileLimit = rateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimit = rateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
