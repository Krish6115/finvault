/**
 * ──────────────────────────────────────────────
 * FinVault — Dashboard Routes
 * ──────────────────────────────────────────────
 *
 * Access control per endpoint:
 *
 *   GET /summary          → VIEWER + ANALYST + ADMIN
 *   GET /category-summary → ANALYST + ADMIN
 *   GET /trends           → ANALYST + ADMIN
 *   GET /recent-activity  → VIEWER + ANALYST + ADMIN
 *
 * Why do Viewers get summary and recent-activity?
 * The finance dashboard's primary use case is visibility.
 * Viewers (e.g., a company executive or board member)
 * need to see the high-level financial position and latest
 * activity without being able to drill into detailed records
 * or modify any data. This matches the role design intent.
 * ──────────────────────────────────────────────
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { dateRangeSchema, trendSchema } from './dashboard.schema';
import * as dashboardController from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /summary
 * High-level financial overview.
 * All authenticated roles (Viewer visibility makes sense here).
 */
router.get(
  '/summary',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(dateRangeSchema),
  dashboardController.getSummary,
);

/**
 * GET /category-summary
 * Breakdown of income/expenses by category.
 * Analyst + Admin (detailed analytical view).
 */
router.get(
  '/category-summary',
  authorize('ANALYST', 'ADMIN'),
  validate(dateRangeSchema),
  dashboardController.getCategorySummary,
);

/**
 * GET /trends
 * Monthly or weekly income/expense trends.
 * Analyst + Admin (analytical view).
 */
router.get(
  '/trends',
  authorize('ANALYST', 'ADMIN'),
  validate(trendSchema),
  dashboardController.getTrends,
);

/**
 * GET /recent-activity
 * Last 10 transactions for the activity feed.
 * All authenticated roles.
 */
router.get(
  '/recent-activity',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  dashboardController.getRecentActivity,
);

export default router;
