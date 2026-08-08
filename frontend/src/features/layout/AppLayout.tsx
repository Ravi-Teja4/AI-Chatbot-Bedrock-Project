'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/features/sidebar/components/Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 260;
const SIDEBAR_BREAKPOINT = 768; // md

/**
 * AppLayout — Root application shell
 *
 * Three-region layout:
 * ┌─────────────────────────────────────┐
 * │  Sidebar (260px)  │  Main Content   │
 * │  (collapsible)    │  (flex-1)       │
 * └─────────────────────────────────────┘
 *
 * Behavior:
 * - Desktop (≥768px): sidebar is visible by default, can be collapsed
 * - Mobile (<768px): sidebar is hidden by default, shown as overlay
 * - Sidebar state persists via localStorage
 * - Keyboard shortcut: Ctrl+B / Cmd+B toggles sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect viewport and adjust sidebar default state
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        // Restore saved preference on desktop
        const saved = localStorage.getItem('sidebar-open');
        setIsSidebarOpen(saved !== 'false');
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (!isMobile) {
        localStorage.setItem('sidebar-open', String(next));
      }
      return next;
    });
  }, [isMobile]);

  // Keyboard shortcut: Ctrl+B / Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -SIDEBAR_WIDTH } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={isMobile ? { x: -SIDEBAR_WIDTH } : { width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'flex-shrink-0 overflow-hidden',
              isMobile && 'fixed inset-y-0 left-0 z-30',
            )}
            style={!isMobile ? {} : { width: SIDEBAR_WIDTH }}
          >
            <Sidebar onToggle={toggleSidebar} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with sidebar toggle */}
        {isMobile && (
          <div className="flex h-12 items-center border-b border-border px-4 md:hidden">
            <button
              onClick={toggleSidebar}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Open sidebar"
              aria-expanded={isSidebarOpen}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="1" y="4" width="16" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <span className="ml-3 text-sm font-semibold text-foreground">AI Chat</span>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
