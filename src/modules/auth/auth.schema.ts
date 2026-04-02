/**
 * ──────────────────────────────────────────────
 * FinVault — Auth Validation Schemas
 * ──────────────────────────────────────────────
 *
 * Zod schemas for validating authentication payloads.
 * These schemas are used by the `validate` middleware
 * to ensure incoming data meets requirements before
 * it reaches the service layer.
 *
 * Why validate at the schema level?
 * By catching invalid data early (before any database
 * calls or business logic), we:
 *   1. Avoid unnecessary DB queries with bad data
 *   2. Return precise, field-level error messages
 *   3. Keep service code focused on business logic
 * ──────────────────────────────────────────────
 */

import { z } from 'zod';

/**
 * Schema for user registration.
 *
 * - name:     2–100 characters, trimmed
 * - email:    Valid email format, lowercased for consistency
 * - password: Minimum 8 characters with at least one uppercase,
 *             one lowercase, and one digit for basic security
 *
 * Note: Role is intentionally NOT accepted here.
 * All public registrations default to VIEWER for security.
 */
const registerBody = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    ),
});

/**
 * Schema for user login.
 *
 * Validation is intentionally lighter than registration —
 * we don't enforce password complexity here because the
 * user is providing an existing password, not creating one.
 */
const loginBody = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Exported validation schemas formatted for the validate middleware.
 * Each key (body, params, query) maps to a Zod schema that
 * validates the corresponding part of the request.
 */
export const registerSchema = { body: registerBody };
export const loginSchema = { body: loginBody };

/** Inferred types for use in services and controllers */
export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;

