'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Auth Context — Placeholder for Future Authentication
 *
 * This context is intentionally minimal. It establishes the contract that
 * all downstream components will consume, so when Cognito/Google Login is
 * added in a future phase, only this context changes — not the components.
 *
 * Architecture pattern:
 * - Components call useAuth() and access user, isAuthenticated, etc.
 * - Right now, a mock anonymous user is returned
 * - In Phase N: replace the provider implementation with Cognito SDK calls
 * - Zero component changes required outside this file
 */

export interface AuthUser {
  userId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider?: 'cognito' | 'google' | 'otp';
}

export interface AuthContextValue {
  /** Current authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** True when authentication state has been resolved (prevents flash) */
  isLoading: boolean;
  /** True when a valid session exists */
  isAuthenticated: boolean;
  /** Sign out — placeholder */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider
 *
 * Phase 1: Returns a mock anonymous user so the rest of the app works
 * without an actual auth system. The userId "anonymous" will be replaced
 * by a real Cognito sub when authentication is implemented.
 *
 * Important: DynamoDB schemas use userId as a partition key. The anonymous
 * userId means data is scoped per-device for now. When Cognito is added,
 * data migration maps anonymous sessions to real user accounts if needed.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      user: {
        userId: 'anonymous',
        name: 'Guest User',
      },
      isLoading: false,
      isAuthenticated: false,
      signOut: async () => {
        // Future: call Cognito signOut() and redirect to /login
        console.warn('[AuthContext] signOut called — authentication not yet implemented');
      },
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — Hook to access authentication state
 *
 * Throws if used outside AuthProvider — this catches missing provider
 * wrapping during development rather than silent undefined behavior.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('[useAuth] must be used within an AuthProvider');
  }
  return context;
}

/**
 * getUserId — Utility for non-component code (services, repositories)
 *
 * Future: this will extract the userId from the JWT/session.
 * Currently returns the anonymous placeholder.
 */
export function getUserId(): string {
  return 'anonymous';
}
