import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isAppError } from '@/utils/errors';
import { sendError } from '@/utils/response';
import { ERROR_CODES, HTTP_STATUS } from '@/constants/error.constants';
import { createLogger } from '@/utils/logger';

const log = createLogger('ErrorMiddleware');

/**
 * Global Error Handler Middleware
 *
 * This is the single catch-all for all unhandled errors in Express.
 * It must be registered LAST — after all routes and other middleware.
 *
 * Error classification:
 * 1. AppError (isOperational=true): Expected errors (404, 422, etc.)
 *    → Logged at 'warn' level, response sent with error details
 * 2. AppError (isOperational=false): Infrastructure errors (DB failures, etc.)
 *    → Logged at 'error' level with stack trace, generic 500 to client
 * 3. ZodError: Validation failures from Zod schemas
 *    → Formatted into readable field-level error messages
 * 4. Unknown errors: Unexpected programming errors
 *    → Logged at 'error' with full stack, generic 500 to client
 *    → Stack trace NEVER sent to client in production
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? 'unknown';

  // 1. Known operational errors (AppError subclasses)
  if (isAppError(err)) {
    const logPayload = {
      requestId,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.isOperational ? {} : { stack: err.stack }),
    };

    if (err.isOperational) {
      log.warn(logPayload, 'Operational error');
    } else {
      log.error(logPayload, 'Non-operational AppError');
    }

    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    log.warn({ requestId, details }, 'Zod validation error');

    sendError(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Request validation failed',
      details,
    );
    return;
  }

  // 3. Express body-parser errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    log.warn({ requestId, message: (err as Error).message }, 'Malformed JSON body');

    sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, 'Malformed JSON request body');
    return;
  }

  // 4. Unknown/unexpected errors — log everything, send nothing sensitive
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  log.error(
    {
      requestId,
      message: errorMessage,
      stack: errorStack,
      type: err instanceof Error ? err.constructor.name : typeof err,
    },
    'Unexpected error — this is a bug',
  );

  sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred. Please try again.',
  );
}

/**
 * 404 Not Found handler
 *
 * Registered AFTER all routes. Any request that reaches here
 * was not matched by any route.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND,
    `Route '${req.method} ${req.path}' not found`,
  );
}
