/**
 * ──────────────────────────────────────────────
 * FinVault — Server Entry Point
 * ──────────────────────────────────────────────
 *
 * Starts the Express HTTP server and verifies database
 * connectivity. Implements graceful shutdown to ensure
 * active requests complete and database connections
 * close cleanly before the process exits.
 *
 * Why separate from app.ts?
 * Separating the Express app configuration (app.ts) from
 * the server startup (server.ts) allows:
 *   1. Supertest to import the app without starting a server
 *   2. The server to be started in different environments
 *      (standalone, serverless, testing) without modification
 *   3. Clean separation of concerns
 *
 * Run with: npm run dev (development with hot-reload)
 *           npm start   (production from compiled output)
 * ──────────────────────────────────────────────
 */

import app from './app';
import { env } from './config';
import { prisma } from './config/database';
import { logger } from './utils/logger';

/**
 * Verifies that the database is reachable before accepting
 * any requests. Fails fast with a clear error if the
 * connection cannot be established.
 */
async function verifyDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to the database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

/**
 * Starts the HTTP server after verifying all dependencies.
 */
async function startServer(): Promise<void> {
  // Verify database connectivity before accepting traffic
  await verifyDatabaseConnection();

  const server = app.listen(env.PORT, () => {
    logger.info(`FinVault API server started`, {
      port: env.PORT,
      environment: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
      health: `http://localhost:${env.PORT}/api/v1/health`,
    });

    console.log('\n──────────────────────────────────────────────');
    console.log('  🏦 FinVault API is running');
    console.log(`  📡 URL:     http://localhost:${env.PORT}`);
    console.log(`  🔍 Health:  http://localhost:${env.PORT}/api/v1/health`);
    console.log(`  🌍 Env:     ${env.NODE_ENV}`);
    console.log('──────────────────────────────────────────────\n');
  });

  // ── Graceful Shutdown ──
  // Ensures active requests complete and database connections
  // close cleanly when the process receives a termination signal.

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      await prisma.$disconnect();
      logger.info('Database connection closed');

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ── Unhandled Errors ──
  // Last line of defense for unexpected errors that escape
  // the Express error handler

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      name: error.name,
      message: error.message,
    });
    // Uncaught exceptions leave the app in an undefined state
    // Shut down and let the process manager restart
    process.exit(1);
  });
}

// ── Start the server ──
startServer();
