'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface MessageListProps {
  conversationId: string;
  isLoading: boolean;
  isTyping?: boolean;
}

/**
 * MessageList — Scrollable list of chat messages
 *
 * Behavior:
 * - Auto-scrolls to bottom when new messages arrive
 * - Preserves scroll position when user scrolls up to read history
 * - Shows typing indicator when AI is responding
 * - Shows skeleton loading state on initial load
 *
 * Phase 1: Static skeleton + empty state
 * Phase 5: Wire to useMessages hook with real data
 */
export function MessageList({ conversationId, isLoading, isTyping = false }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Phase 1 placeholder — Phase 5: from useMessages hook
  const messages: Message[] = [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isTyping]);

  // Detect if user has scrolled up
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUp.current = distanceFromBottom > 100;
  }

  if (isLoading) {
    return (
      <div
        className="h-full overflow-y-auto px-4 py-6"
        aria-label="Loading messages"
        aria-busy="true"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <MessageSkeleton role="user" />
          <MessageSkeleton role="assistant" />
          <MessageSkeleton role="user" />
          <MessageSkeleton role="assistant" />
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isTyping) {
    return (
      <div
        className="flex h-full items-center justify-center"
        aria-label="No messages yet"
      >
        <p className="text-sm text-muted-foreground/50">
          Start the conversation by sending a message.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto scroll-smooth"
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-1">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * MessageSkeleton — loading placeholder
 * ------------------------------------------------------------------ */

function MessageSkeleton({ role }: { role: 'user' | 'assistant' }) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      )}
      <div className="space-y-2 max-w-xs">
        <Skeleton className={`h-4 ${role === 'user' ? 'w-32' : 'w-48'}`} />
        <Skeleton className={`h-4 ${role === 'user' ? 'w-24' : 'w-64'}`} />
        {role === 'assistant' && <Skeleton className="h-4 w-40" />}
      </div>
    </div>
  );
}
