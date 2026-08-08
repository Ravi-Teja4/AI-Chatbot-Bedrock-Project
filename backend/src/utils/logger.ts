import pino from 'pino';
import { env } from '@/config/env.config';

/**
 * Logger — Pino structured logger
 *
 * Pino is chosen over Winston because:
 * - 5-10x faster than Winston (critical for high-throughput API servers)
 * - Structured JSON logs out of the box — essential for CloudWatch
 * - pino-pretty for readable dev output, raw JSON for production
 *
 * Log levels by environment:
 * - development: debug (all messages)
 * - production: info (no debug/trace)
 * - test: warn (minimal noise)
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info({ userId, conversationId }, 'Conversation created');
 *   logger.error({ err, requestId }, 'Database write failed');
 *
 * Child loggers for request-scoped context:
 *   const reqLogger = logger.child({ requestId, userId });
 */

const transport =
  env.LOG_PRETTY && env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
          messageFormat: '[{context}] {msg}',
          levelFirst: true,
        },
      })
    : undefined;

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      pid: process.pid,
      service: 'ai-chat-backend',
      version: process.env['npm_package_version'] ?? '1.0.0',
      env: env.NODE_ENV,
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      // Never log sensitive fields — even in development
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        '*.secretAccessKey',
        '*.accessKeyId',
      ],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);

/**
 * Create a child logger bound to a specific module context.
 * Use this at the top of each module file.
 *
 * @example
 * const log = createLogger('ConversationService');
 */
export function createLogger(context: string): pino.Logger {
  return logger.child({ context });
}
