/**
 * ──────────────────────────────────────────────
 * FinVault — Financial Record Service
 * ──────────────────────────────────────────────
 *
 * Business logic for creating, reading, updating,
 * and soft-deleting financial records. Also handles
 * the rich filtering and sorting logic for the
 * list endpoint.
 *
 * Access control at a glance:
 *   Create / Update / Delete → ADMIN only
 *   Read (list + single)     → ANALYST + ADMIN
 *
 * This is enforced at the route level, not here.
 * The service is access-control agnostic and focused
 * purely on data operations.
 * ──────────────────────────────────────────────
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/apiError';
import { PaginationMeta } from '../../types';
import {
  CreateRecordInput,
  UpdateRecordInput,
  GetRecordsQuery,
} from './record.schema';

/** Safe fields to return — excludes soft-delete metadata */
const RECORD_SAFE_FIELDS = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} as const;

/**
 * Creates a new financial record.
 * Record ownership is tied to the creating user's ID.
 *
 * @param input    - Validated record data
 * @param userId   - ID of the authenticated admin creating this record
 * @returns The created financial record with owner info
 */
export async function createRecord(input: CreateRecordInput, userId: string) {
  const record = await prisma.financialRecord.create({
    data: {
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      description: input.description ?? null,
      userId,
    },
    select: RECORD_SAFE_FIELDS,
  });

  return record;
}

/**
 * Retrieves a paginated, filtered list of financial records.
 *
 * Filtering options:
 *   - type:       Filter by INCOME or EXPENSE
 *   - category:   Partial match on category name
 *   - startDate:  Records from this date (inclusive)
 *   - endDate:    Records up to this date (inclusive)
 *   - search:     Partial text match on description + category
 *
 * Sorting options:
 *   - sortBy: amount | date | createdAt
 *   - order:  asc | desc
 *
 * Count and data are fetched in parallel for efficiency.
 *
 * @param query - Validated filter/pagination parameters
 * @returns Paginated records with metadata
 */
export async function getRecords(query: GetRecordsQuery) {
  const { page, limit, type, category, startDate, endDate, search, sortBy, order } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
    ...(type && { type }),
    ...(category && {
      category: { contains: category },
    }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { description: { contains: search } },
        { category: { contains: search } },
      ],
    }),
  };

  const [total, records] = await Promise.all([
    prisma.financialRecord.count({ where }),
    prisma.financialRecord.findMany({
      where,
      select: RECORD_SAFE_FIELDS,
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return { records, meta };
}

/**
 * Retrieves a single financial record by ID.
 * Excludes soft-deleted records.
 *
 * @param id - The record UUID
 * @returns The record with owner info
 * @throws AppError(404) if not found
 */
export async function getRecordById(id: string) {
  const record = await prisma.financialRecord.findUnique({
    where: { id, deletedAt: null },
    select: RECORD_SAFE_FIELDS,
  });

  if (!record) {
    throw new AppError('Financial record not found.', 404);
  }

  return record;
}

/**
 * Updates a financial record.
 * Only the provided fields are changed — Prisma ignores undefined.
 *
 * @param id    - The target record UUID
 * @param input - Fields to update (all optional)
 * @returns The updated record
 * @throws AppError(404) if not found
 */
export async function updateRecord(id: string, input: UpdateRecordInput) {
  const existing = await prisma.financialRecord.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError('Financial record not found.', 404);
  }

  const updatedRecord = await prisma.financialRecord.update({
    where: { id },
    data: {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.description !== undefined && { description: input.description }),
    },
    select: RECORD_SAFE_FIELDS,
  });

  return updatedRecord;
}

/**
 * Soft-deletes a financial record.
 *
 * Why soft delete on records?
 * Financial records form the backbone of audit trails.
 * Even "incorrect" records might be needed for regulatory
 * lookups. Soft deletion preserves the data while removing
 * it from all active queries.
 *
 * @param id - The target record UUID
 * @returns The soft-deleted record
 * @throws AppError(404) if not found
 */
export async function deleteRecord(id: string) {
  const existing = await prisma.financialRecord.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError('Financial record not found.', 404);
  }

  const deletedRecord = await prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: RECORD_SAFE_FIELDS,
  });

  return deletedRecord;
}
