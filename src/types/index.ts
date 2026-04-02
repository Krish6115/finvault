/**
 * ──────────────────────────────────────────────
 * FinVault — Shared TypeScript Types
 * ──────────────────────────────────────────────
 *
 * Central type definitions used across the application.
 * Extends Express types to include authenticated user
 * context on the Request object.
 *
 * Why extend Express.Request?
 * After JWT authentication, we attach the decoded user
 * to `req.user`. TypeScript needs to know about this
 * augmentation to provide type safety downstream.
 * ──────────────────────────────────────────────
 */

/** Supported user roles in the system */
export type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

/** Supported user account statuses */
export type Status = 'ACTIVE' | 'INACTIVE';

/** Supported financial record types */
export type RecordType = 'INCOME' | 'EXPENSE';

/**
 * Authenticated user payload attached to requests.
 * Extracted from the JWT token after verification.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: Status;
}

/**
 * Pagination metadata returned alongside list responses.
 * Enables clients to implement paginated navigation.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Extend the Express Request interface to include
 * the authenticated user after JWT middleware runs.
 *
 * This allows all downstream handlers to access
 * `req.user` with full type safety.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
