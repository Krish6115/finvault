/**
 * ──────────────────────────────────────────────
 * FinVault — Rate Limiting Middleware
 * ──────────────────────────────────────────────
 *
 * Configures rate limiting to protect the API from
 * abuse and brute-force attacks.
 *
 * Why rate limiting?
 * Public-facing APIs are vulnerable to:
 *   1. Brute-force login attempts
 *   2. Denial-of-service through request flooding
 *   3. Scraping and enumeration attacks
 *
 * Two limiters are provided:
 *   - generalLimiter: Moderate limits for standard endpoints
 *   - authLimiter:    Strict limits for login/register (brute-force protection)
 *
 * Usage:
 *   app.use('/api', generalLimiter);
 *   app.use('/api/v1/auth', authLimiter);
 * ──────────────────────────────────────────────
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config';
import { ApiResponse } from '../utils/apiResponse';

/**
 * General rate limiter for all API endpoints.
 *
 * Default: 100 requests per 15 minutes per IP.
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX_REQUESTS.
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable deprecated `X-RateLimit-*` headers
  message: ApiResponse.error(
    'Too many requests. Please slow down and try again later.',
  ),
});

/**
 * Strict rate limiter for authentication endpoints.
 *
 * 20 requests per 15 minutes per IP — significantly stricter
 * than the general limiter to prevent brute-force attacks
 * on login and registration.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error(
    'Too many authentication attempts. Please try again after 15 minutes.',
  ),
});
