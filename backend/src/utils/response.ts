import type { Response } from 'express';
import { HTTP_STATUS } from '@/constants/error.constants';
import type { ErrorCode } from '@/constants/error.constants';

/**
 * Standard API Response Formatter
 *
 * Every API response, success or error, goes through this module.
 * This guarantees a consistent envelope shape that the frontend
 * can rely on unconditionally.
 *
 * Success envelope:
 * {
 *   success: true,
 *   data: <T>,
 *   meta: { requestId, timestamp },
 *   pagination?: { hasMore, nextCursor, count }
 * }
 *
 * Error envelope:
 * {
 *   success: false,
 *   error: { code, message, details? },
 *   meta: { requestId, timestamp }
 * }
 */

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
  pagination?: PaginationInfo;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: unknown[];
  };
  meta: ResponseMeta;
}

/**
 * sendSuccess — Send a successful JSON response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options: {
    statusCode?: number;
    pagination?: PaginationInfo;
  } = {},
): void {
  const { statusCode = HTTP_STATUS.OK, pagination } = options;
  const requestId = res.locals['requestId'] as string | undefined;

  const body: SuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
    ...(pagination !== undefined ? { pagination } : {}),
  };

  res.status(statusCode).json(body);
}

/**
 * sendCreated — Convenience wrapper for 201 Created responses
 */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, { statusCode: HTTP_STATUS.CREATED });
}

/**
 * sendNoContent — Convenience wrapper for 204 No Content responses
 * Used for DELETE operations that return no body
 */
export function sendNoContent(res: Response): void {
  res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * sendError — Send a structured error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  details?: unknown[],
): void {
  const requestId = res.locals['requestId'] as string | undefined;

  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && details.length > 0 ? { details } : {}),
    },
    meta: {
      requestId: requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(body);
}
