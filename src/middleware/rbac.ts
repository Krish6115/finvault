/**
 * ──────────────────────────────────────────────
 * FinVault — Role-Based Access Control Middleware
 * ──────────────────────────────────────────────
 *
 * Restricts route access based on the authenticated
 * user's role. Must be used AFTER the `authenticate`
 * middleware, since it reads from `req.user`.
 *
 * Why a higher-order function?
 * Different routes require different roles. Instead of
 * writing separate middleware for each combination, we
 * use a factory function that accepts allowed roles and
 * returns the appropriate middleware. This keeps route
 * definitions clean and declarative.
 *
 * Usage:
 *   // Only admins can access this route
 *   router.delete('/users/:id', authenticate, authorize('ADMIN'), handler);
 *
 *   // Analysts and admins can access this route
 *   router.get('/records', authenticate, authorize('ANALYST', 'ADMIN'), handler);
 *
 *   // All authenticated users can access this route
 *   router.get('/summary', authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'), handler);
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiError';
import { Role } from '../types';

/**
 * Creates a middleware that restricts access to users
 * whose role is included in the `allowedRoles` list.
 *
 * @param allowedRoles - Roles permitted to access the route
 * @returns Express middleware that enforces role-based access
 *
 * @throws AppError(401) if no authenticated user is found
 * @throws AppError(403) if the user's role is not in allowedRoles
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError('Authentication is required before authorization.', 401),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
          403,
        ),
      );
    }

    next();
  };
}
