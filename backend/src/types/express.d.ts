/**
 * Express Type Augmentation
 *
 * Extends the Express Request and Response objects with application-specific
 * properties. This provides type safety for context injected by middleware.
 *
 * Properties injected by middleware:
 * - req.requestId: unique ID per request, used for distributed tracing
 * - req.userId: authenticated user ID (set by auth middleware)
 * - res.locals.requestId: same ID accessible from response formatter
 *
 * When Cognito authentication is added:
 * - req.userId will be populated from the verified JWT sub claim
 * - req.user will carry the full decoded token payload
 */

declare global {
  namespace Express {
    interface Request {
      /** Unique request identifier for tracing (set by requestLogger middleware) */
      requestId: string;
      /** Authenticated user ID (set by auth middleware — 'anonymous' in Phase 1) */
      userId: string;
    }

    interface Locals {
      /** Mirrors req.requestId for access in response formatters */
      requestId: string;
    }
  }
}

export {};
