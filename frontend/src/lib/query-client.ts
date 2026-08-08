import { QueryClient } from '@tanstack/react-query';
import { ApiException } from './api-client';

/**
 * React Query Client Configuration
 *
 * Global defaults that apply to every query and mutation unless overridden
 * at the individual hook level.
 *
 * Key decisions:
 * - staleTime: 30s — prevents redundant refetches during active chat sessions
 * - gcTime: 5min — keeps conversation data cached while navigating between chats
 * - retry: smart function — retries transient errors but not client errors (4xx)
 * - refetchOnWindowFocus: false — aggressive for a chat app; user knows when data is stale
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Never retry auth errors or validation errors
          if (error instanceof ApiException) {
            if (error.statusCode === 401 || error.statusCode === 403) return false;
            if (error.statusCode >= 400 && error.statusCode < 500) return false;
          }
          // Retry server errors and network errors up to 2 times
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      },
      mutations: {
        retry: false, // Never auto-retry mutations — user should decide
        onError: (error) => {
          // Global mutation error logger — individual components handle UI feedback
          if (process.env.NODE_ENV === 'development') {
            console.error('[React Query Mutation Error]', error);
          }
        },
      },
    },
  });
}

/**
 * Singleton query client for non-Provider usage (e.g. prefetching in Server Components).
 * The Providers component creates its own instance to avoid sharing state between requests.
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }
  // Browser: reuse singleton
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
