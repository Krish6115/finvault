/**
 * ──────────────────────────────────────────────
 * FinVault — Structured Logger
 * ──────────────────────────────────────────────
 *
 * A lightweight, structured logging utility that
 * provides consistent log formatting with timestamps,
 * log levels, and contextual information.
 *
 * Why not use console.log directly?
 * Direct console calls are difficult to filter,
 * lack timestamps, and can't be easily redirected
 * to external logging services. This wrapper adds:
 *   1. ISO timestamps for traceability
 *   2. Log level indicators for filtering
 *   3. Consistent formatting across the codebase
 *   4. Environment-aware behavior (suppresses debug in prod)
 *
 * In a production system, this could be swapped for
 * Winston or Pino without changing call sites.
 *
 * Usage:
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Database connection failed', { error });
 * ──────────────────────────────────────────────
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Formats a structured log entry with a timestamp and level prefix.
 * Context objects are serialized to JSON for structured logging.
 */
function formatMessage(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;

  if (context && Object.keys(context).length > 0) {
    return `${base} ${JSON.stringify(context)}`;
  }

  return base;
}

export const logger = {
  /** Debug-level logs — suppressed in production */
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', message, context));
    }
  },

  /** Informational logs — general application events */
  info(message: string, context?: Record<string, unknown>): void {
    console.info(formatMessage('INFO', message, context));
  },

  /** Warning logs — recoverable issues that need attention */
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(formatMessage('WARN', message, context));
  },

  /** Error logs — failures that need immediate investigation */
  error(message: string, context?: Record<string, unknown>): void {
    console.error(formatMessage('ERROR', message, context));
  },
};
