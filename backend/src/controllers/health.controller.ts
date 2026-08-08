import type { Request, Response } from 'express';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { docClient, tableName } from '@/config/aws.config';
import { sendSuccess } from '@/utils/response';
import { createLogger } from '@/utils/logger';
import { env } from '@/config/env.config';

const log = createLogger('HealthController');

/**
 * Health Controller
 *
 * Two endpoints:
 * 1. GET /health — lightweight liveness check (used by load balancer / Docker HEALTHCHECK)
 *    Returns 200 immediately — just confirms the Node.js process is alive
 *
 * 2. GET /health/detailed — full readiness check
 *    Verifies DynamoDB connectivity
 *    Used by orchestration to determine if traffic should be routed here
 */

export class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Liveness check
   *     description: Returns 200 if the service process is running. Used for Docker HEALTHCHECK.
   *     responses:
   *       200:
   *         description: Service is alive
   */
  liveness(_req: Request, res: Response): void {
    sendSuccess(res, {
      status: 'ok',
      service: 'ai-chat-backend',
      version: process.env['npm_package_version'] ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * @swagger
   * /health/detailed:
   *   get:
   *     tags: [Health]
   *     summary: Readiness check
   *     description: Checks all downstream dependencies (DynamoDB). Returns 200 only if all healthy.
   *     responses:
   *       200:
   *         description: All dependencies healthy
   *       503:
   *         description: One or more dependencies unavailable
   */
  async readiness(_req: Request, res: Response): Promise<void> {
    const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

    // DynamoDB connectivity check — describe the conversations table
    const dynamoStart = Date.now();
    try {
      await docClient.send(
        new DescribeTableCommand({ TableName: tableName('conversations') }),
      );
      checks['dynamodb'] = { status: 'ok', latencyMs: Date.now() - dynamoStart };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.warn({ err }, 'DynamoDB health check failed');
      checks['dynamodb'] = {
        status: 'error',
        latencyMs: Date.now() - dynamoStart,
        error: env.NODE_ENV === 'production' ? 'Connection failed' : message,
      };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: {
        status: allHealthy ? 'ok' : 'degraded',
        checks,
        uptime: process.uptime(),
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const healthController = new HealthController();
