'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

/**
 * Theme Context — Thin wrapper over next-themes
 *
 * We wrap next-themes rather than consuming it directly in components for
 * two reasons:
 * 1. A single abstraction point — if we ever swap next-themes for another
 *    solution, only this file changes
 * 2. Typed resolved theme prevents string comparison bugs in components
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** Current theme setting (may be 'system') */
  theme: ThemeMode;
  /** Resolved theme after applying system preference */
  resolvedTheme: ResolvedTheme;
  /** Set the theme explicitly */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** True during SSR / before theme resolves — prevents flash */
  isThemeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeContextProviderProps {
  children: ReactNode;
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  const currentTheme = (theme as ThemeMode | undefined) ?? 'system';
  const currentResolved = (resolvedTheme as ResolvedTheme | undefined) ?? (systemTheme as ResolvedTheme | undefined) ?? 'dark';
  const isThemeLoading = resolvedTheme === undefined;

  function toggleTheme() {
    setTheme(currentResolved === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        resolvedTheme: currentResolved,
        setTheme: (t: ThemeMode) => setTheme(t),
        toggleTheme,
        isThemeLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('[useThemeContext] must be used within ThemeContextProvider');
  }
  return context;
}
