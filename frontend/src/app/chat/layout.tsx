import type { Metadata } from 'next';
import { AppLayout } from '@/features/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Chat',
};

interface ChatLayoutProps {
  children: React.ReactNode;
}

/**
 * Chat Layout Wrapper
 *
 * Wraps all /chat/* routes inside the AppLayout (sidebar + main content area).
 * The layout persists across conversation navigation — sidebar state is preserved
 * when the user clicks between conversations.
 *
 * This is a Server Component. Interactive layout behavior (sidebar collapse,
 * keyboard shortcuts) is handled inside AppLayout which is a Client Component.
 */
export default function ChatLayout({ children }: ChatLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
