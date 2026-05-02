const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Global rate limiter — applied to all routes.
 * Default: 100 requests per 15 minutes per IP.
 */
const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
});

/**
 * Strict rate limiter for auth endpoints — 10 attempts per 15 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = { globalRateLimiter, authRateLimiter };
