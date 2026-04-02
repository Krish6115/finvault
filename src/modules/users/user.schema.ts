/**
 * ──────────────────────────────────────────────
 * FinVault — User Validation Schemas
 * ──────────────────────────────────────────────
 *
 * Zod schemas for user management operations.
 * Used exclusively by Admin-protected routes.
 *
 * Design decisions:
 *   - Pagination defaults to page 1, limit 10
 *   - Update schema only allows role and status changes
 *   - Email and password updates are intentionally excluded
 *     to prevent privilege escalation through this endpoint
 *   - UUID validation on path parameters for early rejection
 * ──────────────────────────────────────────────
 */

import { z } from 'zod';

// ──────────────────────────────────────────────
// Query Schemas
// ──────────────────────────────────────────────

/**
 * Validates pagination query parameters for listing users.
 *
 * Both page and limit are optional with sensible defaults.
 * Coerced from strings because query parameters are always
 * received as strings from the URL.
 */
const getUsersQuery = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive().max(1000, 'Page must be 1–1000')),

  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().positive().max(100, 'Limit must be 1–100')),
});

// ──────────────────────────────────────────────
// Param Schemas
// ──────────────────────────────────────────────

/** Validates that the :id URL parameter is a valid UUID */
const userIdParam = z.object({
  id: z.string({ required_error: 'User ID is required' }).uuid('Invalid user ID format'),
});

// ──────────────────────────────────────────────
// Body Schemas
// ──────────────────────────────────────────────

/**
 * Validates the update user request body.
 *
 * Only role and status can be updated through this endpoint.
 * Email and password changes are excluded by design:
 *   - Email changes should go through a verification flow
 *   - Password changes should use a dedicated reset endpoint
 *
 * At least one field must be provided — sending an empty
 * body is rejected with a refinement check.
 */
const updateUserBody = z
  .object({
    role: z
      .enum(['VIEWER', 'ANALYST', 'ADMIN'], {
        errorMap: () => ({ message: 'Role must be VIEWER, ANALYST, or ADMIN' }),
      })
      .optional(),

    status: z
      .enum(['ACTIVE', 'INACTIVE'], {
        errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
      })
      .optional(),
  })
  .refine((data) => data.role || data.status, {
    message: 'At least one field (role or status) must be provided',
  });

// ──────────────────────────────────────────────
// Exports — formatted for the validate middleware
// ──────────────────────────────────────────────

export const getUsersQuerySchema = { query: getUsersQuery };
export const getUserByIdSchema = { params: userIdParam };
export const updateUserSchema = { params: userIdParam, body: updateUserBody };
export const deleteUserSchema = { params: userIdParam };

/** Inferred types for use in services and controllers */
export type GetUsersQuery = z.infer<typeof getUsersQuery>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
