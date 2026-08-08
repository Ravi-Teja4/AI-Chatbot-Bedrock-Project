import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';

const log = createLogger('RequestLogger');

/**
 * Request Logger Middleware
 *
 * Responsibilities:
 * 1. Assign a unique request ID to every incoming request
 * 2. Attach the ID to req and res.locals for access throughout the request lifecycle
 * 3. Log request start and completion with timing, status, and method/path
 *
 * Request ID priority:
 * - Accepts X-Request-ID from client if present (enables end-to-end tracing
 *   when the frontend sends its own correlation ID)
 * - Generates a new UUID v4 otherwise
 *
 * The request ID is included in every API response via the meta field,
 * allowing frontend errors to be correlated with backend logs.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId =
    (req.headers['x-request-id'] as string | undefined) ??
    `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

  req.requestId = requestId;
  res.locals['requestId'] = requestId;

  // Expose request ID in response headers for client-side correlation
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();

  log.info(
    {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Request received',
  );

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    log[level](
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        contentLength: res.get('content-length'),
      },
      'Request completed',
    );
  });

  next();
}
