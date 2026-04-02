/**
 * ──────────────────────────────────────────────
 * FinVault — Financial Record Validation Schemas
 * ──────────────────────────────────────────────
 *
 * Zod schemas for financial record operations.
 * Covers creation, updates, and the rich filtering
 * query parameters used on the list endpoint.
 * ──────────────────────────────────────────────
 */

import { z } from 'zod';

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

const recordType = z.enum(['INCOME', 'EXPENSE'], {
  errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
});

/** ISO date string that coerces into a Date object */
const isoDate = z
  .string({ required_error: 'Date is required' })
  .datetime({ message: 'Date must be a valid ISO 8601 datetime (e.g. 2026-01-15T00:00:00.000Z)' })
  .transform((val) => new Date(val));

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

const recordIdParam = z.object({
  id: z.string({ required_error: 'Record ID is required' }).uuid('Invalid record ID format'),
});

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

/**
 * Validates the create record body.
 * All fields except description are required.
 * Amount must be a positive number greater than zero.
 */
const createRecordBody = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .finite('Amount must be a finite number'),

  type: recordType,

  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must not exceed 100 characters'),

  date: isoDate,

  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

/**
 * Validates the update record body.
 * All fields are optional — only provided fields are updated.
 * At least one field must be present.
 */
const updateRecordBody = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero')
      .finite()
      .optional(),

    type: recordType.optional(),

    category: z
      .string()
      .trim()
      .min(2, 'Category must be at least 2 characters')
      .max(100, 'Category must not exceed 100 characters')
      .optional(),

    date: isoDate.optional(),

    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' },
  );

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

/**
 * Validates the query parameters for listing records.
 *
 * Supports:
 *   - Pagination:  page, limit
 *   - Filtering:   type, category, startDate, endDate
 *   - Sorting:     sortBy (amount | date | createdAt), order (asc | desc)
 *   - Search:      search (full-text on description + category)
 */
const getRecordsQuery = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive().max(1000)),

  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().positive().max(100)),

  type: recordType.optional(),

  category: z.string().trim().optional(),

  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),

  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
    .optional(),

  search: z.string().trim().max(100).optional(),

  sortBy: z
    .enum(['amount', 'date', 'createdAt'], {
      errorMap: () => ({ message: 'sortBy must be amount, date, or createdAt' }),
    })
    .optional()
    .default('date'),

  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'order must be asc or desc' }),
    })
    .optional()
    .default('desc'),
});

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

export const createRecordSchema = { body: createRecordBody };
export const updateRecordSchema = { params: recordIdParam, body: updateRecordBody };
export const getRecordsQuerySchema = { query: getRecordsQuery };
export const recordIdSchema = { params: recordIdParam };

/** Inferred types */
export type CreateRecordInput = z.infer<typeof createRecordBody>;
export type UpdateRecordInput = z.infer<typeof updateRecordBody>;
export type GetRecordsQuery = z.infer<typeof getRecordsQuery>;
