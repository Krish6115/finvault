/**
 * ──────────────────────────────────────────────
 * FinVault — User Routes
 * ──────────────────────────────────────────────
 *
 * Admin-only routes for user management.
 *
 * SECURITY: Every route in this file is protected by:
 *   1. authenticate — Verifies the JWT token
 *   2. authorize('ADMIN') — Restricts to Admin role only
 *
 * This double layer ensures that:
 *   - Unauthenticated requests are rejected (401)
 *   - Non-admin users are rejected (403)
 *   - Only verified admins can manage other users
 *
 * Route summary:
 *   GET    /          — List all users (paginated)
 *   GET    /:id       — Get a single user by ID
 *   PATCH  /:id       — Update user role/status
 *   DELETE /:id       — Soft-delete a user
 * ──────────────────────────────────────────────
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  getUsersQuerySchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema,
} from './user.schema';
import * as userController from './user.controller';

const router = Router();

// Apply authentication and admin authorization to ALL routes
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /
 * Lists all active users with offset-based pagination.
 * Query: ?page=1&limit=10
 */
router.get(
  '/',
  validate(getUsersQuerySchema),
  userController.getUsers,
);

/**
 * GET /:id
 * Retrieves a single user by UUID.
 */
router.get(
  '/:id',
  validate(getUserByIdSchema),
  userController.getUserById,
);

/**
 * PATCH /:id
 * Updates a user's role or status.
 * Body: { role?: "VIEWER" | "ANALYST" | "ADMIN", status?: "ACTIVE" | "INACTIVE" }
 */
router.patch(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser,
);

/**
 * DELETE /:id
 * Soft-deletes a user (sets deletedAt, status → INACTIVE).
 * The record is preserved for audit integrity.
 */
router.delete(
  '/:id',
  validate(deleteUserSchema),
  userController.deleteUser,
);

export default router;
