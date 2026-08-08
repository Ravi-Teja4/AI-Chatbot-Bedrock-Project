import { type ErrorCode, ERROR_CODES, HTTP_STATUS } from '@/constants/error.constants';

/**
 * Custom Error Hierarchy
 *
 * AppError is the base for all application errors thrown in service and repository
 * layers. The error middleware catches these and converts them to the standard
 * API error response shape.
 *
 * Benefits over plain Error objects:
 * - statusCode carried with the error → no mapping tables in middleware
 * - errorCode for programmatic handling on the frontend
 * - isOperational flag distinguishes expected errors (404, 422) from bugs (500)
 *   → Operational errors are logged at 'warn', programming errors at 'error'
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown[];

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    details?: unknown[],
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper prototype chain in transpiled code
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

export class ConversationNotFoundError extends AppError {
  constructor(conversationId: string) {
    super(
      `Conversation '${conversationId}' not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.CONVERSATION_NOT_FOUND,
    );
  }
}

export class MessageNotFoundError extends AppError {
  constructor(messageId: string) {
    super(
      `Message '${messageId}' not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.MESSAGE_NOT_FOUND,
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown[]) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, undefined, false);
    if (cause instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Type guard — check if an error is an operational AppError
 * (i.e., one we threw intentionally vs. an unexpected bug)
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard — check if an error is a DynamoDB ConditionalCheckFailedException
 * Used in repository layer to detect concurrent update conflicts
 */
export function isDynamoConditionalError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'name' in error &&
    error.name === 'ConditionalCheckFailedException'
  );
}
