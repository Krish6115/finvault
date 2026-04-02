/**
 * ──────────────────────────────────────────────
 * FinVault — Zod Validation Middleware
 * ──────────────────────────────────────────────
 *
 * A generic middleware factory that validates incoming
 * request data (body, params, query) against Zod schemas.
 *
 * Why use Zod for validation?
 * Zod integrates natively with TypeScript — validated data
 * is automatically typed, eliminating the gap between
 * validation and type safety. Unlike Joi, there's no need
 * for separate type definitions.
 *
 * Why validate body, params, AND query?
 * Different parts of a request carry different data:
 *   - body:   POST/PATCH/PUT payloads
 *   - params: URL path parameters (e.g., /users/:id)
 *   - query:  Filter/pagination parameters (?page=1&limit=20)
 *
 * By supporting all three, a single middleware handles
 * every validation scenario in the application.
 *
 * Usage:
 *   const schema = { body: createRecordSchema };
 *   router.post('/records', validate(schema), handler);
 *
 *   const schema = { params: z.object({ id: z.string().uuid() }) };
 *   router.get('/records/:id', validate(schema), handler);
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/apiError';

/**
 * Configuration object specifying which parts of the
 * request to validate and with which Zod schemas.
 */
interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Creates a middleware that validates request data against
 * the provided Zod schemas. Replaces raw request data with
 * the parsed (and potentially transformed) values.
 *
 * @param schemas - Object mapping request properties to Zod schemas
 * @returns Express middleware that performs validation
 *
 * @throws Passes ZodError to the error handler on validation failure
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }

      next(new AppError('Request validation failed.', 400));
    }
  };
}
