# 🏦 FinVault

**Finance Data Processing & Access Control Backend**

A role-based financial records management system with dashboard analytics, built for the Zorvyn FinTech Backend Developer Intern assignment.

FinVault demonstrates a production-grade backend architecture featuring JWT authentication, role-based access control, financial record management with soft-delete, and real-time dashboard analytics — all structured with clean separation of concerns.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Tech Stack & Rationale](#-tech-stack--rationale)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Demo Credentials](#-demo-credentials)
- [Role Permission Matrix](#-role-permission-matrix)
- [Core Features](#-core-features)
- [API Endpoints](#-api-endpoints)
- [Running Tests](#-running-tests)
- [Key Design Decisions](#-key-design-decisions)
- [Assumptions & Tradeoffs](#-assumptions--tradeoffs)

---

## 🚀 Quick Start

> **Zero-Setup Evaluation Environment** — FinVault uses SQLite by default so you can run the entire project without installing any database server. Just 4 commands:

```bash
# 1. Install dependencies
npm install

# 2. Push the schema to create the SQLite database
npx prisma db push

# 3. Seed with realistic demo data (3 users, 56 financial records)
npx tsx prisma/seed.ts

# 4. Start the development server
npm run dev
```

The server will start at **http://localhost:3000** with:
- 🔍 **Health Check**: http://localhost:3000/api/v1/health
- 📖 **API Docs (Swagger)**: http://localhost:3000/api/docs
- 🗄️ **Database Explorer**: Run `npx prisma studio` (opens a browser UI)

---

## 🛠️ Tech Stack & Rationale

| Technology | Purpose | Why This Choice |
|---|---|---|
| **Node.js + Express** | Runtime & Framework | Industry standard for APIs. Express is lightweight and allows full control over the middleware stack |
| **TypeScript** | Language | Compile-time type safety catches bugs before they reach production. Shows engineering maturity |
| **Prisma ORM** | Database Layer | Type-safe queries auto-generated from the schema. One-line database swap between SQLite and PostgreSQL |
| **SQLite** | Database | Zero-setup for evaluation. No database server to install. Swappable to PostgreSQL by changing one line in `.env` |
| **JWT (jsonwebtoken)** | Authentication | Stateless, scalable token-based auth. Industry standard for REST APIs |
| **Zod** | Validation | Runtime type validation with native TypeScript inference — validated data is automatically typed |
| **Swagger (OpenAPI 3.0)** | API Docs | Interactive documentation with built-in "Try it out" and JWT authorization support |
| **Jest + Supertest** | Testing | Integration tests that exercise the full Express middleware stack without starting a server |
| **bcryptjs** | Security | Industry-standard password hashing with configurable cost factor |
| **Helmet + CORS** | Security | HTTP security headers and cross-origin controls |
| **express-rate-limit** | Security | Protects against brute-force and abuse |

### Why SQLite?

SQLite was chosen specifically to provide a **zero-setup evaluation experience**. Evaluators don't need to install PostgreSQL, create databases, or configure connection strings — `npx prisma db push` creates a local file database instantly.

The entire Prisma schema is database-agnostic. To switch to PostgreSQL:

```env
# In .env, simply change:
DATABASE_URL="postgresql://user:password@localhost:5432/finvault?schema=public"
```

And update `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.

---

## 🏗️ Architecture

```
finvault/
├── prisma/
│   ├── schema.prisma          # Data models (User, FinancialRecord)
│   └── seed.ts                # Realistic seed data (3 users, 56 records)
├── src/
│   ├── app.ts                 # Express app (middleware stack + routes)
│   ├── server.ts              # Server entry (DB check + graceful shutdown)
│   ├── config/
│   │   ├── index.ts           # Zod-validated environment config
│   │   ├── database.ts        # Prisma client singleton
│   │   └── swagger.ts         # OpenAPI 3.0 spec + Swagger UI
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification + DB user lookup
│   │   ├── rbac.ts            # Role-based access control
│   │   ├── validate.ts        # Generic Zod validation
│   │   ├── errorHandler.ts    # Centralized error handler
│   │   └── rateLimiter.ts     # Request throttling
│   ├── modules/
│   │   ├── auth/              # Registration, Login, /me
│   │   ├── users/             # User CRUD (Admin only)
│   │   ├── records/           # Financial record CRUD + filters
│   │   └── dashboard/         # Summary, trends, analytics
│   ├── utils/
│   │   ├── apiResponse.ts     # Standardized { success, message, data, meta }
│   │   ├── apiError.ts        # Custom AppError class
│   │   └── logger.ts          # Structured logging
│   └── types/
│       └── index.ts           # Shared TypeScript types
└── tests/
    ├── auth.test.ts           # Auth integration tests
    └── dashboard.test.ts      # Dashboard analytics tests
```

### Modular Design

Each feature module (auth, users, records, dashboard) follows the same internal pattern:

```
module/
├── *.schema.ts      → Zod validation schemas
├── *.service.ts     → Business logic (database-agnostic)
├── *.controller.ts  → HTTP request/response handling
└── *.routes.ts      → Route definitions + middleware chaining
```

This separation ensures:
- **Services** can be reused outside of HTTP contexts (e.g., background jobs)
- **Controllers** stay thin — they only parse requests and format responses
- **Schemas** catch invalid data before any business logic executes
- **Routes** clearly declare the middleware chain for each endpoint

---

## 📖 API Documentation

Interactive Swagger documentation is available at:

**http://localhost:3000/api/docs**

The Swagger UI includes a **🔒 Authorize** button where you can paste a JWT token (obtained from `POST /auth/login`) to test protected endpoints directly from the browser.

---

## 🔐 Demo Credentials

The seed script creates 3 users — one for each role:

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Admin** | Krishna Reddy | `admin@finvault.com` | `Admin@123` |
| **Analyst** | Nancy Wheeler | `analyst@finvault.com` | `Analyst@123` |
| **Viewer** | Sneha Chakraborty | `viewer@finvault.com` | `Viewer@123` |

### Quick Login via cURL

```bash
# Login as Admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finvault.com","password":"Admin@123"}'

# Use the returned token in subsequent requests
curl http://localhost:3000/api/v1/dashboard/summary \
  -H "Authorization: Bearer <your-token-here>"
```

---

## 🛡️ Role Permission Matrix

| Endpoint | Viewer | Analyst | Admin |
|----------|:------:|:-------:|:-----:|
| **Auth** |||
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ |
| **Users** |||
| GET /users | ❌ | ❌ | ✅ |
| GET /users/:id | ❌ | ❌ | ✅ |
| PATCH /users/:id | ❌ | ❌ | ✅ |
| DELETE /users/:id | ❌ | ❌ | ✅ |
| **Financial Records** |||
| POST /records | ❌ | ❌ | ✅ |
| GET /records | ❌ | ✅ | ✅ |
| GET /records/:id | ❌ | ✅ | ✅ |
| PATCH /records/:id | ❌ | ❌ | ✅ |
| DELETE /records/:id | ❌ | ❌ | ✅ |
| **Dashboard** |||
| GET /dashboard/summary | ✅ | ✅ | ✅ |
| GET /dashboard/category-summary | ❌ | ✅ | ✅ |
| GET /dashboard/trends | ❌ | ✅ | ✅ |
| GET /dashboard/recent-activity | ✅ | ✅ | ✅ |

---

## ✨ Core Features

### 1. User & Role Management
- JWT authentication with registration and login
- Three roles with strict access boundaries (Viewer, Analyst, Admin)
- User status management (Active / Inactive)
- Soft-delete preserves audit trails

### 2. Financial Records Management
- Full CRUD operations on financial records
- Rich filtering: type, category, date range, text search
- Configurable sorting by amount, date, or creation time
- Offset-based pagination with metadata (total, pages, hasNext/hasPrev)
- Soft-delete to maintain historical data integrity

### 3. Dashboard Analytics
- **Summary**: Total income, expenses, net balance, surplus/deficit indicator
- **Category Breakdown**: Income and expense totals grouped by category
- **Trends**: Monthly or weekly income/expense trends over time
- **Recent Activity**: Last 10 transactions for the activity feed

### 4. Access Control
- JWT middleware verifies tokens and loads fresh user data from DB
- Role-based middleware restricts endpoints by user role
- Inactive and soft-deleted users are blocked from all access
- Self-modification prevention (admins can't demote or delete themselves)

### 5. Validation & Error Handling
- Zod schemas validate body, params, and query parameters
- Centralized error handler for AppError, ZodError, Prisma errors, and generic errors
- Consistent response format: `{ success, message, data, meta }`
- Environment-aware error detail (verbose in dev, minimal in production)

### 6. Data Persistence
- SQLite via Prisma ORM (zero-setup, swappable to PostgreSQL)
- Composite database indexes for optimized filtering
- Seed script with 56 realistic financial records spanning 6 months

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create a new VIEWER account |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get current user profile |

### Users (Admin Only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users (paginated) |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update role or status |
| DELETE | `/users/:id` | Soft-delete user |

### Financial Records
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/records` | Admin | Create record |
| GET | `/records` | Analyst, Admin | List with filters |
| GET | `/records/:id` | Analyst, Admin | Get by ID |
| PATCH | `/records/:id` | Admin | Update record |
| DELETE | `/records/:id` | Admin | Soft-delete record |

### Dashboard Analytics
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/dashboard/summary` | All | Income, expenses, balance |
| GET | `/dashboard/category-summary` | Analyst, Admin | Category breakdown |
| GET | `/dashboard/trends` | Analyst, Admin | Monthly/weekly trends |
| GET | `/dashboard/recent-activity` | All | Last 10 transactions |

### Filtering & Pagination

Records list endpoint supports rich query parameters:

```
GET /api/v1/records?type=INCOME&category=Consulting&startDate=2026-01-01T00:00:00.000Z&endDate=2026-03-31T23:59:59.999Z&search=AWS&sortBy=amount&order=desc&page=1&limit=20
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

The test suite includes:
- **Auth tests**: Registration flow, login validation, anti-enumeration verification, JWT token handling, password exclusion
- **Dashboard tests**: Summary math verification, category grouping, trend structure, RBAC enforcement, date ordering

---

## 🧠 Key Design Decisions

### Security

| Decision | Rationale |
|----------|-----------|
| **Hardcoded VIEWER role on registration** | Prevents privilege escalation through the public API. Only admins can promote users |
| **Anti-enumeration login errors** | Both "wrong email" and "wrong password" return identical `401` messages to prevent attackers from discovering valid emails |
| **JWT contains only user ID** | Role and status are fetched fresh from DB on each request. If an admin deactivates a user, the change takes effect immediately — no waiting for token expiry |
| **Bcrypt cost factor 12** | Balances security (~250ms per hash) with usability. Industry standard for production systems |
| **Auth rate limiting (20/15min)** | Login endpoints get a stricter rate limit than general API endpoints to slow brute-force attacks |
| **10kb body limit** | Prevents oversized payload attacks on JSON endpoints |
| **Helmet security headers** | Protects against XSS, clickjacking, MIME sniffing, and other common web vulnerabilities |

### Architecture

| Decision | Rationale |
|----------|-----------|
| **Soft delete (not hard delete)** | Financial records must be preserved for audit compliance. Soft-deleted records are excluded from queries but remain in the database |
| **app.ts / server.ts separation** | Allows Supertest to import the Express app for testing without starting an HTTP server |
| **Environment validation at startup** | Missing env vars cause cryptic runtime errors. Zod validates all config at boot and fails fast with a clear message |
| **Parallel DB queries** | List endpoints run `count` and `findMany` in `Promise.all` for better performance |
| **Self-modification prevention** | Admins cannot change their own role/status or delete themselves, preventing accidental lockout |
| **Standardized API response** | Every endpoint returns `{ success, message, data, meta }` so frontend consumers have a predictable contract |

### Database

| Decision | Rationale |
|----------|-----------|
| **SQLite default** | Zero-setup for evaluators. No database installation. One env change to switch to PostgreSQL |
| **Composite indexes** | `[type, category]` and `[userId, date]` indexes optimize the most common filter queries |
| **Application-level trends** | SQLite lacks `date_trunc`. Trends are computed in JavaScript for portability. Trade-off documented inline |
| **Prisma client singleton** | Prevents connection exhaustion during hot-reloads in development |

---

## 📝 Assumptions & Tradeoffs

1. **Single-tenant system**: All financial records are treated as belonging to one organization. Multi-tenancy could be added via a `tenantId` field.

2. **String-based enums**: SQLite doesn't support native database enums. Roles and types are stored as strings with validation at the application layer via Zod.

3. **Offset pagination**: Used for simplicity and compatibility with table-based UIs. Cursor-based pagination would be more efficient at scale but adds complexity.

4. **In-memory trend computation**: The `getTrends` service fetches records and groups by period in JavaScript rather than using database-level aggregation. This works well for the expected dataset size and maintains SQLite compatibility. For production with large datasets, this would move to database-level `GROUP BY` with `date_trunc` (PostgreSQL).

5. **No refresh tokens**: The current implementation uses single JWT tokens with a 7-day expiry. A production system would add refresh token rotation for better security.

6. **No email verification**: Registration creates accounts immediately without email confirmation. This is intentional for the scope of this assignment.

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev Server | `npm run dev` | Start with hot-reload (tsx watch) |
| Build | `npm run build` | Compile TypeScript to JavaScript |
| Start | `npm start` | Run compiled output (production) |
| DB Push | `npm run db:push` | Push schema changes to database |
| DB Migrate | `npm run db:migrate` | Create a migration |
| DB Studio | `npm run db:studio` | Open Prisma Studio (database GUI) |
| Seed | `npm run seed` | Seed the database with demo data |
| Test | `npm test` | Run all tests |
| Test Watch | `npm run test:watch` | Run tests in watch mode |
| Lint | `npm run lint` | Type check with TypeScript |

---

## 📄 License

MIT

---

*Built with ❤️ for the Zorvyn FinTech Backend Developer Intern Assignment*
