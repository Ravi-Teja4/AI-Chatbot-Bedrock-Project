/**
 * Application Entry Point
 *
 * Responsibilities:
 * 1. Import env config first (validates env vars, exits if invalid)
 * 2. Create the Express app
 * 3. Start the HTTP server
 * 4. Handle graceful shutdown (SIGTERM/SIGINT)
 *
 * Graceful shutdown is critical for production:
 * - EC2 Auto Scaling sends SIGTERM before terminating instances
 * - We stop accepting new connections, wait for in-flight requests to complete
 * - Then close the server and exit
 */

// Must be imported first — validates all environment variables at startup
import '@/config/env.config';

import { createServer } from 'http';
import { createApp } from './app';
import { env } from '@/config/env.config';
import { logger } from '@/utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000; // 10 seconds max for graceful shutdown

async function main(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  // Start listening
  server.listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        port: env.PORT,
        host: env.HOST,
        env: env.NODE_ENV,
        pid: process.pid,
      },
      `🚀 AI Chat Backend started — http://${env.HOST}:${env.PORT}`,
    );

    logger.info(
      `📚 API: http://localhost:${env.PORT}/api/${env.API_VERSION}`,
    );

    if (env.NODE_ENV !== 'production') {
      logger.info(
        `📖 Docs: http://localhost:${env.PORT}/api/${env.API_VERSION}/docs`,
      );
    }
  });

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  function shutdown(signal: string): void {
    logger.info({ signal }, 'Shutdown signal received — starting graceful shutdown');

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error during server close');
        process.exit(1);
      }

      logger.info('HTTP server closed — all connections drained');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error(
        { timeoutMs: SHUTDOWN_TIMEOUT_MS },
        'Graceful shutdown timed out — forcing exit',
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref(); // unref() prevents the timeout from keeping Node alive
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled Rejection / Exception Handlers ────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection — this is a bug');
    // In production, exit after an unhandled rejection to let the container restart
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down immediately');
    process.exit(1);
  });
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
