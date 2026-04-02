/**
 * ──────────────────────────────────────────────
 * FinVault — Dashboard Service
 * ──────────────────────────────────────────────
 *
 * Aggregation and analytics logic for dashboard APIs.
 * These queries power the top-level financial overview
 * that all roles can see, as well as the deeper
 * analytics available to Analysts and Admins.
 *
 * All aggregations exclude soft-deleted records.
 *
 * Endpoints powered by this service:
 *   GET /summary          — Total income, expenses, net balance
 *   GET /category-summary — Breakdown by category
 *   GET /trends           — Monthly or weekly income/expense trends
 *   GET /recent-activity  — Last 10 transactions
 * ──────────────────────────────────────────────
 */

import { prisma } from '../../config/database';
import { DateRangeQuery, TrendQuery } from './dashboard.schema';

/**
 * Builds a shared Prisma date filter from optional startDate/endDate.
 * Returns an empty object when no dates are provided (all-time).
 */
function buildDateFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return {};

  return {
    date: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };
}

/**
 * Returns the high-level financial summary.
 *
 * Runs three parallel queries:
 *   1. Sum of all INCOME records
 *   2. Sum of all EXPENSE records
 *   3. Total record count
 *
 * Net balance is derived as income - expenses.
 *
 * @param query - Optional date range filter
 */
export async function getSummary(query: DateRangeQuery) {
  const dateFilter = buildDateFilter(query.startDate, query.endDate);

  const baseWhere = { deletedAt: null, ...dateFilter };

  const [incomeResult, expenseResult, totalCount] = await Promise.all([
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { ...baseWhere, type: 'INCOME' },
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { ...baseWhere, type: 'EXPENSE' },
    }),
    prisma.financialRecord.count({ where: baseWhere }),
  ]);

  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpenses = expenseResult._sum.amount ?? 0;
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    totalRecords: totalCount,
    incomeCount: incomeResult._count,
    expenseCount: expenseResult._count,
    position: netBalance >= 0 ? 'surplus' : 'deficit',
  };
}

/**
 * Returns a category-wise financial breakdown.
 *
 * Groups records by category, computing totals for:
 *   - INCOME categories (e.g., Client Payments, Consulting)
 *   - EXPENSE categories (e.g., Salaries, Cloud Infrastructure)
 *
 * Results are sorted by total amount descending within each type,
 * making the largest contributors immediately visible.
 *
 * @param query - Optional date range filter
 */
export async function getCategorySummary(query: DateRangeQuery) {
  const dateFilter = buildDateFilter(query.startDate, query.endDate);
  const baseWhere = { deletedAt: null, ...dateFilter };

  const grouped = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    _sum: { amount: true },
    _count: true,
    where: baseWhere,
    orderBy: { _sum: { amount: 'desc' } },
  });

  type GroupedEntry = (typeof grouped)[number];

  const income = grouped
    .filter((g: GroupedEntry) => g.type === 'INCOME')
    .map((g: GroupedEntry) => ({
      category: g.category,
      total: g._sum.amount ?? 0,
      count: g._count,
    }));

  const expenses = grouped
    .filter((g: GroupedEntry) => g.type === 'EXPENSE')
    .map((g: GroupedEntry) => ({
      category: g.category,
      total: g._sum.amount ?? 0,
      count: g._count,
    }));

  return { income, expenses };
}

/**
 * Returns financial trends over time — monthly or weekly.
 *
 * Because SQLite lacks native date truncation functions,
 * we fetch all records in the range and group them in
 * JavaScript. This is efficient for datasets of this scale
 * and avoids database-specific SQL that would break
 * portability to PostgreSQL.
 *
 * For production at high volume, this logic would move to
 * a database-level GROUP BY with date_trunc (PostgreSQL).
 *
 * @param query - Date range + period (monthly | weekly)
 */
export async function getTrends(query: TrendQuery) {
  const { startDate, endDate, period } = query;

  const effectiveEndDate = endDate ? new Date(endDate) : new Date();
  const effectiveStartDate = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(effectiveEndDate.getMonth() - 5));

  const records = await prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
      date: { gte: effectiveStartDate, lte: effectiveEndDate },
    },
    select: { amount: true, type: true, date: true },
    orderBy: { date: 'asc' },
  });

  function getPeriodKey(date: Date): string {
    if (period === 'monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    // ISO week number
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  const periodMap = new Map<string, { income: number; expenses: number }>();

  for (const record of records) {
    const key = getPeriodKey(record.date);

    if (!periodMap.has(key)) {
      periodMap.set(key, { income: 0, expenses: 0 });
    }

    const entry = periodMap.get(key)!;
    if (record.type === 'INCOME') {
      entry.income += record.amount;
    } else {
      entry.expenses += record.amount;
    }
  }

  const trends = Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, { income, expenses }]) => ({
      period: periodKey,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
    }));

  return { period, trends };
}

/**
 * Returns the 10 most recent financial transactions.
 * Used for the dashboard activity feed.
 *
 * No date filter — always returns the latest 10 globally.
 */
export async function getRecentActivity() {
  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      description: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 10,
  });

  return records;
}
