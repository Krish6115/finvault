/**
 * ──────────────────────────────────────────────
 * FinVault — Standardized API Response
 * ──────────────────────────────────────────────
 *
 * Provides a consistent response format across all
 * API endpoints. Every response follows the structure:
 *
 *   {
 *     "success": true | false,
 *     "message": "Human-readable description",
 *     "data":    { ... } | null,
 *     "meta":    { pagination, etc. } | undefined
 *   }
 *
 * Why standardize responses?
 * Consistent response shapes make the API predictable
 * for frontend consumers. They always know where to
 * find the data, the status, and any pagination info
 * without guessing per-endpoint.
 *
 * Usage:
 *   res.status(200).json(ApiResponse.success('Users fetched', users));
 *   res.status(201).json(ApiResponse.success('Record created', record));
 *   res.status(400).json(ApiResponse.error('Invalid input'));
 * ──────────────────────────────────────────────
 */

interface ResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  /**
   * Creates a successful response payload.
   *
   * @param message - Human-readable success message
   * @param data    - Response data (object, array, or primitive)
   * @param meta    - Optional metadata (pagination, counts, etc.)
   */
  static success<T>(
    message: string,
    data: T | null = null,
    meta?: Record<string, unknown>,
  ): ResponseBody<T> {
    return {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
  }

  /**
   * Creates an error response payload.
   *
   * @param message - Human-readable error description
   * @param data    - Optional error details (validation errors, etc.)
   */
  static error<T = unknown>(
    message: string,
    data: T | null = null,
  ): ResponseBody<T> {
    return {
      success: false,
      message,
      data,
    };
  }
}
