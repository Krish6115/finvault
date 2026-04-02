/**
 * ──────────────────────────────────────────────
 * FinVault — Auth Integration Tests
 * ──────────────────────────────────────────────
 *
 * Tests the authentication flow end-to-end:
 *   - Registration with validation
 *   - Login with correct and incorrect credentials
 *   - Anti-enumeration (same error for wrong email vs wrong password)
 *   - JWT token generation and /me endpoint
 *   - Role assignment (public registration = VIEWER only)
 *
 * Uses Supertest to make HTTP requests against the Express
 * app without starting an actual server.
 * ──────────────────────────────────────────────
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

// Unique email to avoid conflicts between test runs
const testEmail = `test-${Date.now()}@finvault.com`;
let authToken: string;

// ──────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────

afterAll(async () => {
  // Clean up test user and close database connection
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────
// POST /api/v1/auth/register
// ──────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return a JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: 'Test@1234',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.name).toBe('Test User');
    expect(res.body.data.token).toBeDefined();

    // Store token for subsequent tests
    authToken = res.body.data.token;
  });

  it('should enforce VIEWER role on public registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: 'Test@1234',
      });

    // The first registration already happened, this will be a 409.
    // So let's check the first registration's role from the stored response.
    // We use the token to check /me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(meRes.body.data.user.role).toBe('VIEWER');
  });

  it('should reject duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        password: 'Test@1234',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'Test@1234',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak Pass',
        email: 'weakpass@test.com',
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'noname@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// POST /api/v1/auth/login
// ──────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials and return a JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Test@1234',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);

    // Update token for /me tests
    authToken = res.body.data.token;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword1',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@finvault.com',
        password: 'Test@1234',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return identical error messages for wrong email and wrong password (anti-enumeration)', async () => {
    const wrongEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@finvault.com', password: 'Test@1234' });

    const wrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPass@1' });

    // Both should return 401 with the SAME generic message
    // This prevents attackers from determining if an email is registered
    expect(wrongEmail.status).toBe(401);
    expect(wrongPass.status).toBe(401);
    expect(wrongEmail.body.message).toBe(wrongPass.body.message);
    expect(wrongEmail.body.message).toBe('Invalid email or password.');
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/auth/me
// ──────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  it('should return the current user profile with a valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    // Password must NEVER be in the response
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject requests without a token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
