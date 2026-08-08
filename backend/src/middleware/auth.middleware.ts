import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@/utils/logger';

const log = createLogger('AuthMiddleware');

/**
 * Authentication Middleware — Phase 1 Placeholder
 *
 * Current behavior: pass-through that sets userId to 'anonymous'.
 *
 * Future implementation (Phase N — Cognito):
 * 1. Extract Bearer token from Authorization header
 * 2. Verify token with AWS Cognito public keys (JWKS)
 * 3. Decode the verified JWT payload
 * 4. Set req.userId = payload.sub (Cognito user ID)
 * 5. Optionally set req.user with full profile data
 * 6. Return 401 for missing/invalid tokens (unless route is public)
 *
 * This design means:
 * - All downstream services already receive req.userId
 * - DynamoDB queries are already partitioned by userId
 * - Adding real auth = only changing this file
 *
 * Architecture note: when Cognito is added, create separate middleware
 * variants: requireAuth() and optionalAuth() for public vs protected routes.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Phase 1: anonymous user for all requests
  req.userId = 'anonymous';

  // Future: uncomment and implement Cognito token verification
  // const token = extractBearerToken(req);
  // if (!token) {
  //   return next(new UnauthorizedError('Authentication required'));
  // }
  // try {
  //   const payload = await verifyCognitoToken(token);
  //   req.userId = payload.sub;
  //   next();
  // } catch (err) {
  //   next(new UnauthorizedError('Invalid or expired token'));
  // }

  log.debug({ requestId: req.requestId, userId: req.userId }, 'Auth middleware (pass-through)');

  next();
}

/**
 * requireAuth — Future guard for protected routes
 *
 * Placeholder that currently passes through.
 * Will enforce authentication when Cognito is integrated.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // Phase 1: no-op
  // Phase N: check req.userId !== 'anonymous', throw UnauthorizedError if so
  next();
}
