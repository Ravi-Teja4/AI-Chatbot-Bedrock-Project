'use client';

import { type ReactNode, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import { createQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers — Root Provider Composition
 *
 * All global providers are composed here in a single Client Component boundary.
 * This keeps the root layout.tsx a Server Component (better performance) while
 * providing all necessary client-side context.
 *
 * Provider order matters:
 * 1. ThemeProvider (next-themes) — must be outermost for class injection on <html>
 * 2. ThemeContextProvider — wraps next-themes with our typed interface
 * 3. QueryClientProvider — React Query state
 * 4. AuthProvider — user session state
 *
 * Note: QueryClient is created inside useState to ensure each request on the server
 * gets a fresh client (prevents state sharing between requests in SSR).
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="ai-chat-theme"
    >
      <ThemeContextProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>

          {/* React Query Devtools — stripped from production builds */}
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        </QueryClientProvider>
      </ThemeContextProvider>
    </ThemeProvider>
  );
}
