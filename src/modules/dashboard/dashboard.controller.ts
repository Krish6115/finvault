/**
 * ──────────────────────────────────────────────
 * FinVault — Dashboard Controller
 * ──────────────────────────────────────────────
 *
 * HTTP handlers for the four dashboard analytics endpoints.
 * Delegates entirely to the dashboard service and formats
 * responses with ApiResponse.
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import * as dashboardService from './dashboard.service';
import { DateRangeQuery, TrendQuery } from './dashboard.schema';

/**
 * GET /api/v1/dashboard/summary
 *
 * Returns overall financial health:
 *   totalIncome, totalExpenses, netBalance,
 *   totalRecords, incomeCount, expenseCount, position
 *
 * Access: All authenticated users (VIEWER, ANALYST, ADMIN)
 * Query: ?startDate=&endDate= (optional)
 */
export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await dashboardService.getSummary(
      req.query as unknown as DateRangeQuery,
    );

    res.status(200).json(
      ApiResponse.success('Dashboard summary retrieved successfully.', summary),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/category-summary
 *
 * Returns income and expense totals grouped by category.
 * Useful for pie/bar charts on the dashboard.
 *
 * Access: ANALYST + ADMIN
 * Query: ?startDate=&endDate= (optional)
 */
export async function getCategorySummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await dashboardService.getCategorySummary(
      req.query as unknown as DateRangeQuery,
    );

    res.status(200).json(
      ApiResponse.success('Category summary retrieved successfully.', summary),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/trends
 *
 * Returns income/expense trends over time.
 * Each data point includes: period, income, expenses, net.
 *
 * Access: ANALYST + ADMIN
 * Query: ?period=monthly|weekly &startDate= &endDate=
 */
export async function getTrends(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const trends = await dashboardService.getTrends(
      req.query as unknown as TrendQuery,
    );

    res.status(200).json(
      ApiResponse.success('Trend data retrieved successfully.', trends),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/recent-activity
 *
 * Returns the 10 most recent financial transactions
 * for the dashboard activity feed.
 *
 * Access: All authenticated users (VIEWER, ANALYST, ADMIN)
 */
export async function getRecentActivity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const activity = await dashboardService.getRecentActivity();

    res.status(200).json(
      ApiResponse.success('Recent activity retrieved successfully.', { activity }),
    );
  } catch (error) {
    next(error);
  }
}
