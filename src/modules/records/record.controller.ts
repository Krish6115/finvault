/**
 * ──────────────────────────────────────────────
 * FinVault — Financial Record Controller
 * ──────────────────────────────────────────────
 *
 * HTTP handlers for financial record CRUD operations.
 *
 * Access pattern:
 *   POST, PATCH, DELETE → ADMIN only
 *   GET (list + single) → ANALYST + ADMIN
 *
 * All enforced at the route level via middleware.
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/apiError';
import * as recordService from './record.service';
import { GetRecordsQuery } from './record.schema';

/**
 * POST /api/v1/records
 *
 * Creates a new financial record as the calling admin.
 * Status 201: Record created successfully
 */
export async function createRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const record = await recordService.createRecord(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success('Financial record created successfully.', { record }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/records
 *
 * Returns paginated, filtered financial records.
 * Query: ?page=1&limit=10&type=INCOME&category=Salaries
 *        &startDate=2026-01-01T00:00:00.000Z
 *        &endDate=2026-03-31T23:59:59.999Z
 *        &search=AWS&sortBy=date&order=desc
 *
 * Status 200: Records retrieved with pagination meta
 */
export async function getRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { records, meta } = await recordService.getRecords(
      req.query as unknown as GetRecordsQuery,
    );

    res.status(200).json(
      ApiResponse.success(
        'Financial records retrieved successfully.',
        { records },
        meta as unknown as Record<string, unknown>,
      ),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/records/:id
 *
 * Retrieves a single record by UUID.
 * Status 200: Record found
 * Status 404: Record not found or soft-deleted
 */
export async function getRecordById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.getRecordById(req.params.id as string);

    res.status(200).json(
      ApiResponse.success('Financial record retrieved successfully.', { record }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/records/:id
 *
 * Updates a financial record's fields.
 * Only provided fields are changed.
 * Status 200: Record updated
 * Status 404: Record not found
 */
export async function updateRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.updateRecord(
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success('Financial record updated successfully.', { record }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/records/:id
 *
 * Soft-deletes a financial record (sets deletedAt).
 * Record is preserved for audit trail purposes.
 * Status 200: Record soft-deleted
 * Status 404: Record not found
 */
export async function deleteRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.deleteRecord(req.params.id as string);

    res.status(200).json(
      ApiResponse.success('Financial record deleted successfully.', { record }),
    );
  } catch (error) {
    next(error);
  }
}
