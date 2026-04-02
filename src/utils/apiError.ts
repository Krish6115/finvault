/**
 * ──────────────────────────────────────────────
 * FinVault — Custom Application Error
 * ──────────────────────────────────────────────
 *
 * Extends the native Error class to include HTTP
 * status codes and an operational flag.
 *
 * Why a custom error class?
 * Express doesn't natively distinguish between
 * expected errors (bad input, unauthorized access)
 * and unexpected errors (database crashes). This
 * class allows us to:
 *   1. Attach meaningful HTTP status codes
 *   2. Mark errors as "operational" (expected) vs
 *      "programming" (unexpected bugs)
 *   3. Provide consistent error handling in the
 *      global error handler middleware
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Email already exists', 409);
 * ──────────────────────────────────────────────
 */

export class AppError extends Error {
  /** HTTP status code (e.g., 400, 401, 404, 500) */
  public readonly statusCode: number;

  /**
   * Indicates whether the error is operational (expected)
   * or a programming bug (unexpected).
   *
   * Operational errors: Invalid input, missing resource, unauthorized
   * Programming errors: TypeError, null reference, unhandled cases
   *
   * The global error handler uses this flag to decide how
   * much detail to expose in the response.
   */
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Preserve the correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture a clean stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}
