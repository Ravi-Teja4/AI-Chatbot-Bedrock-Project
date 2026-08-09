'use client';

import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatWindowProps {
  conversationId: string;
}

/**
 * ChatWindow — Main conversation view
 *
 * Layout:
 * ┌────────────────────────────┐
 * │  Conversation Header       │  (title, future: model selector, share)
 * │────────────────────────────│
 * │                            │
 * │  Message List (flex-1)     │  ← scrollable, auto-scrolls to bottom
 * │                            │
 * │────────────────────────────│
 * │  Chat Input                │  ← pinned to bottom
 * └────────────────────────────┘
 *
 * Phase 1: Structure + skeleton loading state
 * Phase 5: Wire useMessages hook, real conversation data
 */
export function ChatWindow({ conversationId }: ChatWindowProps) {
  // Phase 1: static states. Phase 5: from useMessages / useConversation hooks
  const isLoadingConversation = false;
  const isLoadingMessages = false;
  const isSendingMessage = false;
  const conversationTitle = 'Conversation'; // Phase 5: from API

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Conversation Header */}
      <ConversationHeader
        title={conversationTitle}
        isLoading={isLoadingConversation}
      />

      {/* Message area — flex-1 so it takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          conversationId={conversationId}
          isLoading={isLoadingMessages}
        />
      </div>

      {/* Input — always pinned to bottom */}
      <ChatInput
        conversationId={conversationId}
        isLoading={isSendingMessage}
        onSend={(message) => {
          // Phase 5: sendMessage(message)
          console.warn('[ChatWindow] sendMessage not yet implemented:', message);
        }}
        onStop={() => {
          // Phase 6: stopStreaming()
          console.warn('[ChatWindow] stopStreaming not yet implemented');
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
 * ConversationHeader
 * ------------------------------------------------------------------ */

interface ConversationHeaderProps {
  title: string;
  isLoading: boolean;
}

function ConversationHeader({ title, isLoading }: ConversationHeaderProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-border/50 px-4 flex-shrink-0">
      {isLoading ? (
        <Skeleton className="h-4 w-48" />
      ) : (
        <motion.h1
          key={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold text-foreground truncate max-w-sm"
        >
          {title}
        </motion.h1>
      )}

      {/* Future: model selector, share button, export */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/50 hidden sm:inline">
          {/* Phase 5: model name */}
        </span>
      </div>
    </div>
  );
}
