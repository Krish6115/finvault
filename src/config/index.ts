/**
 * ──────────────────────────────────────────────
 * FinVault — Environment Configuration
 * ──────────────────────────────────────────────
 *
 * Validates and exports all environment variables
 * using Zod schema validation at startup.
 *
 * Why validate environment variables?
 * Missing or malformed env vars are one of the most
 * common causes of runtime failures. By validating
 * at startup, we fail fast with a clear error message
 * instead of encountering cryptic errors later.
 *
 * Usage:
 *   import { env } from '../config';
 *   console.log(env.PORT); // Fully typed & validated
 * ──────────────────────────────────────────────
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Schema defining all required environment variables
 * with their types, defaults, and constraints.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),

  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().int().positive().max(65535)),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(8, 'JWT_SECRET must be at least 8 characters'),

  JWT_EXPIRES_IN: z
    .string()
    .default('7d'),

  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform(Number)
    .pipe(z.number().positive()),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform(Number)
    .pipe(z.number().positive()),
});

/**
 * Parse and validate environment variables.
 * If validation fails, log a descriptive error and exit immediately.
 * This prevents the server from starting with invalid configuration.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/** Validated and typed environment variables */
export const env = parsed.data;
