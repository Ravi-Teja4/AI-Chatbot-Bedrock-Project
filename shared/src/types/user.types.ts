/**
 * User Types
 *
 * Phase 1: Minimal user shape — only what's needed without authentication.
 * Phase N (Cognito): Expanded with email, provider, subscription plan, etc.
 *
 * The userId field maps directly to:
 * - Cognito: JWT sub claim
 * - DynamoDB: partition key on conversations and settings tables
 * - All API requests: extracted from verified JWT by auth middleware
 */

export interface User {
  userId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  /** Authentication provider — expanded when Cognito/Google Login is added */
  provider?: 'cognito' | 'google' | 'otp';
  /** ISO timestamp */
  createdAt: string;
  updatedAt: string;
}

/** Minimal user profile returned in API responses */
export interface UserProfile {
  userId: string;
  name?: string;
  avatarUrl?: string;
}
