/**
 * ──────────────────────────────────────────────
 * FinVault — Financial Record Routes
 * ──────────────────────────────────────────────
 *
 * Routes for financial record management with
 * per-route role enforcement:
 *
 *   POST   /           → ADMIN only (create)
 *   GET    /           → ANALYST + ADMIN (list with filters)
 *   GET    /:id        → ANALYST + ADMIN (single record)
 *   PATCH  /:id        → ADMIN only (update)
 *   DELETE /:id        → ADMIN only (soft-delete)
 *
 * Why per-route (not router-level) authorization?
 * Unlike the users module where all routes share one role,
 * records have mixed access: Analysts can read but only
 * Admins can write. We apply authorize() per-route here
 * so the access level is explicit and visible at a glance.
 * ──────────────────────────────────────────────
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createRecordSchema,
  updateRecordSchema,
  getRecordsQuerySchema,
  recordIdSchema,
} from './record.schema';
import * as recordController from './record.controller';

const router = Router();

// All record routes require authentication
router.use(authenticate);

/**
 * POST /
 * Create a new financial record. Admin only.
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createRecordSchema),
  recordController.createRecord,
);

/**
 * GET /
 * List records with pagination and filters. Analyst + Admin.
 * ?page &limit &type &category &startDate &endDate &search &sortBy &order
 */
router.get(
  '/',
  authorize('ANALYST', 'ADMIN'),
  validate(getRecordsQuerySchema),
  recordController.getRecords,
);

/**
 * GET /:id
 * Single record by UUID. Analyst + Admin.
 */
router.get(
  '/:id',
  authorize('ANALYST', 'ADMIN'),
  validate(recordIdSchema),
  recordController.getRecordById,
);

/**
 * PATCH /:id
 * Update a record. Admin only.
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateRecordSchema),
  recordController.updateRecord,
);

/**
 * DELETE /:id
 * Soft-delete a record. Admin only.
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(recordIdSchema),
  recordController.deleteRecord,
);

export default router;
