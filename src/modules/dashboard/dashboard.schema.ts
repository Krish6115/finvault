/**
 * ──────────────────────────────────────────────
 * FinVault — Dashboard Validation Schemas
 * ──────────────────────────────────────────────
 *
 * Schemas for optional date-range filtering on
 * dashboard endpoints. All fields are optional —
 * omitting them returns all-time aggregates.
 * ──────────────────────────────────────────────
 */

import { z } from 'zod';

/**
 * Optional date range filter for summary and trend endpoints.
 * When omitted, the service returns all-time data.
 */
const dateRangeQuery = z.object({
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),

  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
    .optional(),
});

/**
 * Trend period selector — weekly or monthly breakdown.
 * Defaults to monthly for meaningful aggregation.
 */
const trendQuery = dateRangeQuery.extend({
  period: z
    .enum(['weekly', 'monthly'], {
      errorMap: () => ({ message: 'Period must be weekly or monthly' }),
    })
    .optional()
    .default('monthly'),
});

// Exports formatted for the validate middleware
export const dateRangeSchema = { query: dateRangeQuery };
export const trendSchema = { query: trendQuery };

/** Inferred types */
export type DateRangeQuery = z.infer<typeof dateRangeQuery>;
export type TrendQuery = z.infer<typeof trendQuery>;
