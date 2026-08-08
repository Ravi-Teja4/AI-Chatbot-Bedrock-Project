import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { sendError } from '@/utils/response';
import { ERROR_CODES, HTTP_STATUS } from '@/constants/error.constants';

/**
 * Validation Middleware Factory
 *
 * Creates Express middleware that validates request data against a Zod schema.
 * On success, replaces the original request data with the parsed (type-safe) data.
 * On failure, sends a 422 Unprocessable Entity response with field-level details.
 *
 * Usage in route files:
 *   router.post('/', validate(createConversationSchema, 'body'), handler);
 *   router.get('/', validate(listConversationsSchema, 'query'), handler);
 *
 * The controller receives req.body / req.params / req.query that is guaranteed
 * to match the schema type — no runtime type errors downstream.
 */
export function validate<TOutput>(
  schema: ZodSchema<TOutput, ZodTypeDef, unknown>,
  target: 'body' | 'params' | 'query' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      sendError(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        'Request validation failed',
        details,
      );
      return;
    }

    // Replace raw input with type-safe parsed output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[target] = result.data;
    next();
  };
}
