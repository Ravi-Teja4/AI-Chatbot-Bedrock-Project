'use client';

import { MessageSquare } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ConversationList — Renders the list of past conversations
 *
 * Phase 1: Renders empty state + skeleton placeholders
 * Phase 5: Will consume useConversations hook with real API data
 *
 * Grouping strategy (Phase 5):
 * - Today
 * - Yesterday
 * - Previous 7 days
 * - Previous 30 days
 * - Older (by month)
 */
export function ConversationList() {
  // Phase 1 — static loading skeleton to validate layout
  const isLoading = false;
  const conversations: Array<{ id: string; title: string; updatedAt: string }> = [];

  if (isLoading) {
    return (
      <div className="space-y-1" aria-label="Loading conversations" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-1 py-1">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent mb-3">
          <MessageSquare
            className="h-5 w-5 text-sidebar-foreground/40"
            aria-hidden="true"
          />
        </div>
        <p className="text-xs font-medium text-sidebar-foreground/60">No conversations yet</p>
        <p className="text-[11px] text-sidebar-foreground/40 mt-1">
          Start a new chat to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="list" aria-label="Conversation history">
      {conversations.map((conv) => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </div>
  );
}
