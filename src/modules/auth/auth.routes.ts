/**
 * ──────────────────────────────────────────────
 * FinVault — Auth Routes
 * ──────────────────────────────────────────────
 *
 * Defines the authentication route handlers with
 * their validation schemas, rate limiting, and
 * authentication middleware.
 *
 * Route structure:
 *   POST /register  — Public, validated, creates account
 *   POST /login     — Public, rate-limited, validated
 *   GET  /me        — Protected, requires JWT
 *
 * Why apply authLimiter to login specifically?
 * Login endpoints are prime targets for brute-force
 * attacks. The stricter auth rate limiter (20 req/15min)
 * significantly slows down credential stuffing attempts
 * while remaining transparent to legitimate users.
 * ──────────────────────────────────────────────
 */

import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

/**
 * POST /register
 * Public endpoint — creates a new VIEWER account.
 * The validate middleware ensures name, email, and password
 * meet the schema requirements before reaching the controller.
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register,
);

/**
 * POST /login
 * Public endpoint with stricter rate limiting.
 * The authLimiter runs first to block brute-force attempts
 * before any validation or database queries occur.
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login,
);

/**
 * GET /me
 * Protected endpoint — requires a valid JWT.
 * The authenticate middleware verifies the token,
 * loads the user from the database, and attaches
 * it to req.user before the controller runs.
 */
router.get(
  '/me',
  authenticate,
  authController.me,
);

export default router;
