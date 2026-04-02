/**
 * ──────────────────────────────────────────────
 * FinVault — Express Application Setup
 * ──────────────────────────────────────────────
 *
 * Configures the Express application with all
 * middleware, routes, and error handling. This file
 * is separated from server.ts to allow the app to
 * be imported independently for testing (Supertest)
 * without actually starting the HTTP server.
 *
 * Middleware stack (order matters):
 *   1. Helmet     — Security HTTP headers
 *   2. CORS       — Cross-origin resource sharing
 *   3. Rate Limit — Request throttling
 *   4. JSON Parse — Body parsing
 *   5. Routes     — API route handlers
 *   6. 404        — Catch unmatched routes
 *   7. Error      — Global error handler (must be last)
 * ──────────────────────────────────────────────
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse } from './utils/apiResponse';
import { AppError } from './utils/apiError';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import recordRoutes from './modules/records/record.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { setupSwagger } from './config/swagger';

// ──────────────────────────────────────────────
// Initialize Express Application
// ──────────────────────────────────────────────

const app = express();

// ──────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────

// Security headers — protects against common web vulnerabilities
// (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS — allows cross-origin requests from frontend clients
// In production, restrict `origin` to your actual domain
app.use(cors({
  origin: env.NODE_ENV === 'production' ? false : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — protects against abuse and brute-force
app.use('/api', generalLimiter);

// Body parsing — parses incoming JSON payloads
// Limit set to 10kb to prevent oversized payload attacks
app.use(express.json({ limit: '10kb' }));

// URL-encoded form parsing (for compatibility)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ──────────────────────────────────────────────
// Health Check Endpoint
// ──────────────────────────────────────────────

/**
 * GET /api/v1/health
 *
 * Simple health check endpoint for monitoring services,
 * load balancers, and deployment verification.
 * Returns the server status, environment, and uptime.
 */
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json(
    ApiResponse.success('FinVault API is running', {
      status: 'healthy',
      environment: env.NODE_ENV,
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    }),
  );
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ──────────────────────────────────────────────
// Swagger API Documentation
// ──────────────────────────────────────────────

setupSwagger(app);

// ──────────────────────────────────────────────
// 404 Handler — Catch unmatched routes
// ──────────────────────────────────────────────

app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

// ──────────────────────────────────────────────
// Global Error Handler — Must be registered last
// ──────────────────────────────────────────────

app.use(errorHandler);

export default app;
