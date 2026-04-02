/** 
 * ──────────────────────────────────────────────
 * FinVault — Prisma Client Singleton
 * ──────────────────────────────────────────────
 * 
 * Creates and exports a single Prisma Client instance
 * to be shared across the entire application.
 * 
 * Why a singleton?
 * In development, hot-reloading can create multiple
 * Prisma Client instances, exhausting database
 * connections. This pattern prevents that by storing
 * the client on the global object.
 * 
 * Usage:
 *   import { prisma } from '../config/database';
 *   const users = await prisma.user.findMany();
 * ──────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client singleton instance.
 * 
 * - In development: Reuses the instance stored on `globalThis`
 *   to prevent connection exhaustion during hot-reloads.
 * - In production: Creates a fresh instance (no hot-reload concern).
 * 
 * Logging is enabled in development for easier debugging.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
