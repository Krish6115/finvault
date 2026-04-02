/**
 * ──────────────────────────────────────────────
 * FinVault — User Controller
 * ──────────────────────────────────────────────
 *
 * HTTP request handlers for user management.
 * All handlers are Admin-only (enforced at route level).
 *
 * Each handler follows the same pattern:
 *   1. Extract validated data from the request
 *   2. Delegate to the service layer
 *   3. Format and send the response via ApiResponse
 *   4. Forward any errors to the global error handler
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/apiError';
import * as userService from './user.service';
import { GetUsersQuery } from './user.schema';

/**
 * GET /api/v1/users
 *
 * Lists all active users with pagination.
 * Query params: ?page=1&limit=10
 *
 * Returns users array plus pagination metadata
 * for frontend table navigation.
 */
export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { users, meta } = await userService.getUsers(req.query as unknown as GetUsersQuery);

    res.status(200).json(
      ApiResponse.success('Users retrieved successfully.', { users }, meta as unknown as Record<string, unknown>),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id
 *
 * Retrieves a single user by their UUID.
 *
 * Status 200: User found and returned
 * Status 404: User not found or soft-deleted
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id as string);

    res.status(200).json(
      ApiResponse.success('User retrieved successfully.', { user }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id
 *
 * Updates a user's role or status.
 * Only admins can perform this action, and they
 * cannot modify their own account.
 *
 * Status 200: User updated
 * Status 400: Self-modification attempt
 * Status 404: User not found
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const updatedUser = await userService.updateUser(
      req.params.id as string,
      req.body,
      req.user.id,
    );

    res.status(200).json(
      ApiResponse.success('User updated successfully.', { user: updatedUser }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/users/:id
 *
 * Soft-deletes a user — sets deletedAt and status to INACTIVE.
 * The record is preserved for audit purposes.
 * Admins cannot delete their own account.
 *
 * Status 200: User soft-deleted
 * Status 400: Self-deletion attempt
 * Status 404: User not found
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const deletedUser = await userService.deleteUser(
      req.params.id as string,
      req.user.id,
    );

    res.status(200).json(
      ApiResponse.success('User deleted successfully.', { user: deletedUser }),
    );
  } catch (error) {
    next(error);
  }
}
