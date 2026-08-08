'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Square, Paperclip } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  conversationId: string | null;
  isLoading: boolean;
  onSend?: (message: string) => void;
  onStop?: () => void;
}

const MAX_CHARS = 4000;
const MIN_ROWS = 1;
const MAX_ROWS = 12;
const LINE_HEIGHT = 24; // px — matches text-sm leading-6

/**
 * ChatInput — Auto-resizing textarea with send/stop controls
 *
 * Features:
 * - Auto-grows from 1 to 12 rows as user types
 * - Enter sends, Shift+Enter adds newline
 * - Shows character counter when near limit
 * - Send button becomes Stop button while AI is responding
 * - Paperclip placeholder for future file upload
 * - Disabled state while loading
 *
 * Phase 1: UI only — onSend calls a no-op
 * Phase 5: Will be wired to useSendMessage mutation
 */
export function ChatInput({ conversationId, isLoading, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearLimit = value.length > MAX_CHARS * 0.8;
  const isAtLimit = value.length >= MAX_CHARS;
  const canSend = value.trim().length > 0 && !isAtLimit && !isLoading;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight;
    const maxHeight = MAX_ROWS * LINE_HEIGHT;
    el.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setValue(newValue);
      adjustHeight();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full border-t border-border/50 bg-background px-4 pb-4 pt-3">
        <div className="mx-auto w-full max-w-3xl">
          {/* Input container */}
          <div
            className={cn(
              'relative flex items-end gap-2 rounded-2xl border bg-background shadow-sm transition-colors',
              isLoading
                ? 'border-border/50 opacity-90'
                : 'border-border hover:border-border/80 focus-within:border-ring/50',
            )}
          >
            {/* Future: file attach button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="mb-2.5 ml-3 flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:cursor-not-allowed"
                  disabled
                  aria-label="Attach file (coming soon)"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>File upload coming soon</TooltipContent>
            </Tooltip>

            {/* Auto-resize textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'AI is responding...' : 'Message AI Chat...'}
              disabled={isLoading}
              rows={MIN_ROWS}
              className={cn(
                'flex-1 resize-none bg-transparent py-3 pr-2 text-sm text-foreground placeholder:text-muted-foreground/60',
                'focus:outline-none disabled:cursor-not-allowed',
                'leading-6 min-h-[44px]',
              )}
              style={{ overflowY: 'hidden' }}
              aria-label="Chat message input"
              aria-multiline="true"
            />

            {/* Character counter + send/stop button */}
            <div className="mb-2 mr-2 flex flex-shrink-0 flex-col items-end gap-1">
              {/* Character counter */}
              <AnimatePresence>
                {isNearLimit && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      'text-[10px] font-mono tabular-nums',
                      isAtLimit ? 'text-destructive' : 'text-muted-foreground/60',
                    )}
                    aria-live="polite"
                    aria-label={`${MAX_CHARS - value.length} characters remaining`}
                  >
                    {MAX_CHARS - value.length}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Send / Stop button */}
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onStop}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
                      aria-label="Stop generating"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                        canSend
                          ? 'bg-foreground text-background hover:bg-foreground/90 cursor-pointer'
                          : 'bg-muted text-muted-foreground/30 cursor-not-allowed',
                      )}
                      aria-label="Send message"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  {!canSend && !isLoading && (
                    <TooltipContent>Type a message to send</TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>

          {/* Footer hint */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
            AI can make mistakes. Verify important information.
            {conversationId && (
              <span className="ml-1 font-mono opacity-50">
                ID: {conversationId.slice(0, 8)}
              </span>
            )}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
