/**
 * ──────────────────────────────────────────────
 * FinVault — Swagger API Documentation
 * ──────────────────────────────────────────────
 *
 * Configures swagger-jsdoc and swagger-ui-express
 * to provide interactive API documentation at /api/docs.
 *
 * Why Swagger?
 * Interactive documentation lets evaluators and frontend
 * developers test every endpoint directly from the browser
 * without needing Postman or cURL. The "Authorize" button
 * in the UI allows pasting a JWT for protected routes.
 *
 * Usage:
 *   import { setupSwagger } from './config/swagger';
 *   setupSwagger(app);
 * ──────────────────────────────────────────────
 */

import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './index';

const swaggerDefinition: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinVault API',
      version: '1.0.0',
      description:
        'Finance Data Processing & Access Control Backend — A role-based financial records management system with dashboard analytics. Built with Express, TypeScript, and Prisma.',
      contact: {
        name: 'FinVault Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development Server',
      },
    ],
    // JWT Bearer Token security scheme
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter the JWT token obtained from POST /auth/login. Example: eyJhbGci...',
        },
      },
      schemas: {
        // ── Auth Schemas ──
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secure@123', minLength: 8 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@finvault.com' },
            password: { type: 'string', example: 'Admin@123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
              },
            },
          },
        },

        // ── User Schema ──
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },

        // ── Financial Record Schemas ──
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 50000 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string', example: 'Client Payments' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string', nullable: true },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRecordRequest: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', example: 75000 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
            category: { type: 'string', example: 'Consulting Revenue' },
            date: { type: 'string', format: 'date-time', example: '2026-04-01T12:00:00.000Z' },
            description: { type: 'string', example: 'Technical consultation for Q2', nullable: true },
          },
        },
        UpdateRecordRequest: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string', nullable: true },
          },
        },

        // ── Dashboard Schemas ──
        DashboardSummary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number', example: 2341000 },
            totalExpenses: { type: 'number', example: 1286200 },
            netBalance: { type: 'number', example: 1054800 },
            totalRecords: { type: 'integer', example: 56 },
            incomeCount: { type: 'integer', example: 22 },
            expenseCount: { type: 'integer', example: 34 },
            position: { type: 'string', enum: ['surplus', 'deficit'] },
          },
        },

        // ── Generic Response ──
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
            meta: { type: 'object', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed. Please check your input.' },
            data: { type: 'object', nullable: true },
          },
        },
      },
    },

    // ── Paths (all API endpoints) ──
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new account',
          description: 'Creates a new user with VIEWER role. Returns the user profile and a JWT token.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: 'Account created successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login to an existing account',
          description: 'Authenticates with email and password. Returns a JWT token for protected endpoints. Rate limited to 20 attempts per 15 minutes.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials' },
            403: { description: 'Account deactivated' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profile retrieved' },
            401: { description: 'Not authenticated' },
          },
        },
      },

      '/users': {
        get: {
          tags: ['Users (Admin)'],
          summary: 'List all users',
          description: 'Returns a paginated list of all active users. Admin access only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'Users retrieved' }, 403: { description: 'Admin access required' } },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users (Admin)'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User found' }, 404: { description: 'User not found' } },
        },
        patch: {
          tags: ['Users (Admin)'],
          summary: 'Update user role or status',
          description: 'Update a user\'s role or status. Cannot modify your own account.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } },
          },
          responses: { 200: { description: 'User updated' }, 400: { description: 'Self-modification not allowed' }, 404: { description: 'User not found' } },
        },
        delete: {
          tags: ['Users (Admin)'],
          summary: 'Soft-delete a user',
          description: 'Sets deletedAt and status to INACTIVE. Cannot delete your own account.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User deleted' }, 400: { description: 'Self-deletion not allowed' } },
        },
      },

      '/records': {
        post: {
          tags: ['Financial Records'],
          summary: 'Create a financial record (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRecordRequest' } } },
          },
          responses: { 201: { description: 'Record created' }, 403: { description: 'Admin access required' } },
        },
        get: {
          tags: ['Financial Records'],
          summary: 'List records with filters (Analyst + Admin)',
          description: 'Returns paginated, filtered financial records with sorting and text search.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Partial match filter' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search description and category' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['amount', 'date', 'createdAt'], default: 'date' } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          ],
          responses: { 200: { description: 'Records retrieved with pagination' } },
        },
      },
      '/records/{id}': {
        get: {
          tags: ['Financial Records'],
          summary: 'Get record by ID (Analyst + Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Record found' }, 404: { description: 'Record not found' } },
        },
        patch: {
          tags: ['Financial Records'],
          summary: 'Update a record (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRecordRequest' } } },
          },
          responses: { 200: { description: 'Record updated' }, 404: { description: 'Record not found' } },
        },
        delete: {
          tags: ['Financial Records'],
          summary: 'Soft-delete a record (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Record soft-deleted' }, 404: { description: 'Record not found' } },
        },
      },

      '/dashboard/summary': {
        get: {
          tags: ['Dashboard Analytics'],
          summary: 'Financial summary (All roles)',
          description: 'Returns total income, expenses, net balance, and position (surplus/deficit).',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
          ],
          responses: { 200: { description: 'Summary retrieved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/DashboardSummary' } } } } } } },
        },
      },
      '/dashboard/category-summary': {
        get: {
          tags: ['Dashboard Analytics'],
          summary: 'Category breakdown (Analyst + Admin)',
          description: 'Returns income and expense totals grouped by category.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
          ],
          responses: { 200: { description: 'Category summary retrieved' }, 403: { description: 'Analyst or Admin required' } },
        },
      },
      '/dashboard/trends': {
        get: {
          tags: ['Dashboard Analytics'],
          summary: 'Income/expense trends (Analyst + Admin)',
          description: 'Returns monthly or weekly income, expense, and net trends.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['monthly', 'weekly'], default: 'monthly' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, required: false },
          ],
          responses: { 200: { description: 'Trend data retrieved' }, 403: { description: 'Analyst or Admin required' } },
        },
      },
      '/dashboard/recent-activity': {
        get: {
          tags: ['Dashboard Analytics'],
          summary: 'Recent transactions (All roles)',
          description: 'Returns the 10 most recent financial transactions.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Recent activity retrieved' } },
        },
      },
    },
  },
  apis: [], // We define paths inline above
};

/** Generated Swagger specification */
const swaggerSpec = swaggerJsdoc(swaggerDefinition);

/**
 * Mounts Swagger UI at /api/docs on the Express app.
 *
 * Features:
 *   - Interactive "Try it out" for every endpoint
 *   - JWT "Authorize" button for testing protected routes
 *   - Auto-generated from the OpenAPI 3.0 spec above
 */
export function setupSwagger(app: Express): void {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'FinVault API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
      },
    }),
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
