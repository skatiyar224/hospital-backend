/**
 * rateLimiter.middleware.js
 * ------------------------------------------------------------------
 * Two rate limiters:
 *  - `apiLimiter`  applied globally to all /api requests.
 *  - `authLimiter` applied only to auth routes (login/register) with
 *                   a much tighter cap, to slow down brute-force /
 *                   credential-stuffing attempts.
 * ------------------------------------------------------------------
 */

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

module.exports = { apiLimiter, authLimiter };
