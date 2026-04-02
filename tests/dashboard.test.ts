/**
 * ──────────────────────────────────────────────
 * FinVault — Dashboard Integration Tests
 * ──────────────────────────────────────────────
 *
 * Tests the dashboard analytics endpoints against
 * the seeded data to verify aggregation correctness.
 *
 * These tests use the seeded Admin account to access
 * protected routes. They verify that:
 *   - Summary totals are mathematically correct
 *   - Category grouping produces expected buckets
 *   - Trends return properly structured period data
 *   - Recent activity returns the expected count
 *   - RBAC controls access per role
 * ──────────────────────────────────────────────
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

let adminToken: string;
let viewerToken: string;

// ──────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────

beforeAll(async () => {
  // Login as Admin for full dashboard access
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@finvault.com', password: 'Admin@123' });
  adminToken = adminRes.body.data.token;

  // Ensure viewer role is correctly set (prevents test cross-contamination)
  await prisma.user.updateMany({
    where: { email: 'viewer@finvault.com' },
    data: { role: 'VIEWER' },
  });

  // Login as Viewer for RBAC tests
  const viewerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'viewer@finvault.com', password: 'Viewer@123' });
  viewerToken = viewerRes.body.data.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────
// GET /api/v1/dashboard/summary
// ──────────────────────────────────────────────

describe('GET /api/v1/dashboard/summary', () => {
  it('should return the correct financial summary', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;

    // Verify the summary fields exist and are numbers
    expect(typeof data.totalIncome).toBe('number');
    expect(typeof data.totalExpenses).toBe('number');
    expect(typeof data.netBalance).toBe('number');
    expect(typeof data.totalRecords).toBe('number');

    // Net balance must equal income minus expenses
    expect(data.netBalance).toBe(data.totalIncome - data.totalExpenses);

    // Income must be positive (seeded data has income records)
    expect(data.totalIncome).toBeGreaterThan(0);

    // Expenses must be positive (seeded data has expense records)
    expect(data.totalExpenses).toBeGreaterThan(0);

    // Position must reflect the balance
    if (data.netBalance >= 0) {
      expect(data.position).toBe('surplus');
    } else {
      expect(data.position).toBe('deficit');
    }

    // Counts must sum to total
    expect(data.incomeCount + data.expenseCount).toBe(data.totalRecords);
  });

  it('should be accessible to VIEWER role', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary');

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/dashboard/category-summary
// ──────────────────────────────────────────────

describe('GET /api/v1/dashboard/category-summary', () => {
  it('should return income and expense categories', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/category-summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;

    // Should have both income and expense arrays
    expect(Array.isArray(data.income)).toBe(true);
    expect(Array.isArray(data.expenses)).toBe(true);

    // Each category entry should have the expected shape
    if (data.income.length > 0) {
      expect(data.income[0]).toHaveProperty('category');
      expect(data.income[0]).toHaveProperty('total');
      expect(data.income[0]).toHaveProperty('count');
      expect(typeof data.income[0].total).toBe('number');
      expect(data.income[0].total).toBeGreaterThan(0);
    }

    if (data.expenses.length > 0) {
      expect(data.expenses[0]).toHaveProperty('category');
      expect(data.expenses[0]).toHaveProperty('total');
      expect(data.expenses[0]).toHaveProperty('count');
    }

    // Seeded data has multiple categories for both types
    expect(data.income.length).toBeGreaterThanOrEqual(3);
    expect(data.expenses.length).toBeGreaterThanOrEqual(5);
  });

  it('should block VIEWER role from accessing category-summary', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/category-summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/dashboard/trends
// ──────────────────────────────────────────────

describe('GET /api/v1/dashboard/trends', () => {
  it('should return monthly trends with the correct structure', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends?period=monthly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;

    expect(data.period).toBe('monthly');
    expect(Array.isArray(data.trends)).toBe(true);
    expect(data.trends.length).toBeGreaterThan(0);

    // Each trend entry should have period, income, expenses, net
    const firstTrend = data.trends[0];
    expect(firstTrend).toHaveProperty('period');
    expect(firstTrend).toHaveProperty('income');
    expect(firstTrend).toHaveProperty('expenses');
    expect(firstTrend).toHaveProperty('net');

    // Net must equal income minus expenses for each period
    for (const trend of data.trends) {
      const expectedNet = Math.round((trend.income - trend.expenses) * 100) / 100;
      expect(trend.net).toBe(expectedNet);
    }

    // Period format should be "YYYY-MM"
    expect(firstTrend.period).toMatch(/^\d{4}-\d{2}$/);
  });

  it('should return weekly trends when period=weekly', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends?period=weekly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const { data } = res.body;
    expect(data.period).toBe('weekly');

    if (data.trends.length > 0) {
      // Week format should be "YYYY-Wnn"
      expect(data.trends[0].period).toMatch(/^\d{4}-W\d{2}$/);
    }
  });

  it('should block VIEWER role from accessing trends', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/dashboard/recent-activity
// ──────────────────────────────────────────────

describe('GET /api/v1/dashboard/recent-activity', () => {
  it('should return the 10 most recent transactions', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent-activity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(Array.isArray(data.activity)).toBe(true);
    expect(data.activity.length).toBeLessThanOrEqual(10);

    // Each transaction should have required fields
    if (data.activity.length > 0) {
      const first = data.activity[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('amount');
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('category');
      expect(first).toHaveProperty('date');
    }

    // Should be ordered by date descending
    for (let i = 1; i < data.activity.length; i++) {
      const prev = new Date(data.activity[i - 1].date).getTime();
      const curr = new Date(data.activity[i].date).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it('should be accessible to VIEWER role', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent-activity')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
