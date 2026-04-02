/**
 * ──────────────────────────────────────────────
 * FinVault — Global Error Handler Middleware
 * ──────────────────────────────────────────────
 *
 * Catches all errors thrown by route handlers and
 * middleware, then returns a clean, structured JSON
 * response. This is the single point of error formatting
 * in the application.
 *
 * Why a centralized error handler?
 * Without it, each route handler would need its own
 * try-catch with response formatting — leading to
 * inconsistent error responses and duplicated logic.
 * A centralized handler ensures:
 *   1. All errors follow the same response shape
 *   2. Sensitive details are hidden in production
 *   3. Different error types are handled appropriately
 *   4. Logging happens in one place
 *
 * Handles:
 *   - AppError:        Custom operational errors with status codes
 *   - ZodError:        Validation failures with field-level details
 *   - Prisma errors:   Database constraint violations
 *   - Generic errors:  Unexpected server errors (500)
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Formats Zod validation errors into a human-readable
 * field-level error map for the API consumer.
 *
 * Example output:
 *   { "email": "Invalid email format", "amount": "Expected number" }
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    formatted[path || 'unknown'] = issue.message;
  }

  return formatted;
}

/**
 * Maps common Prisma error codes to user-friendly messages.
 * Prevents leaking internal database details to the client.
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): { statusCode: number; message: string } {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return {
        statusCode: 409,
        message: `A record with this ${field} already exists.`,
      };
    }
    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        message: 'The requested record was not found.',
      };
    case 'P2003':
      // Foreign key constraint failure
      return {
        statusCode: 400,
        message: 'Operation failed due to a related record constraint.',
      };
    default:
      return {
        statusCode: 500,
        message: 'A database error occurred.',
      };
  }
}

/**
 * Express global error handler middleware.
 *
 * Must be registered LAST with `app.use()` and must have
 * exactly 4 parameters for Express to recognize it as
 * an error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── 1. Handle custom application errors ──
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      isOperational: err.isOperational,
    });

    res.status(err.statusCode).json(
      ApiResponse.error(err.message),
    );
    return;
  }

  // ── 2. Handle Zod validation errors ──
  if (err instanceof ZodError) {
    const fieldErrors = formatZodErrors(err);

    logger.warn('Validation error', { fields: fieldErrors });

    res.status(400).json(
      ApiResponse.error('Validation failed. Please check your input.', fieldErrors),
    );
    return;
  }

  // ── 3. Handle Prisma database errors ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, message } = handlePrismaError(err);

    logger.error(`Prisma error [${err.code}]: ${message}`, {
      code: err.code,
      meta: err.meta,
    });

    res.status(statusCode).json(
      ApiResponse.error(message),
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { message: err.message });

    res.status(400).json(
      ApiResponse.error('Invalid data provided to the database.'),
    );
    return;
  }

  // ── 4. Handle unexpected / unknown errors ──
  logger.error('Unexpected error', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(500).json(
    ApiResponse.error(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error',
    ),
  );
}
