'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn, truncateText, formatRelativeTime } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationItemProps {
  conversation: Conversation;
}

/**
 * ConversationItem — Single conversation entry in sidebar
 *
 * States:
 * - Default: title + relative timestamp, hover reveals actions
 * - Editing: inline rename input with confirm/cancel
 * - Active: highlighted background
 *
 * Phase 1: UI only (rename/delete are no-ops until Phase 5)
 */
export function ConversationItem({ conversation }: ConversationItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = pathname === `/chat/${conversation.id}`;

  function handleClick() {
    if (!isEditing) {
      router.push(`/chat/${conversation.id}`);
    }
  }

  function handleStartEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(conversation.title);
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }

  function handleConfirmEdit(e: React.MouseEvent) {
    e.stopPropagation();
    // Phase 5: Call updateConversation mutation
    setIsEditing(false);
  }

  function handleCancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle(conversation.title);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    // Phase 5: Call deleteConversation mutation with confirmation
    console.warn('[ConversationItem] Delete not yet implemented');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(conversation.title);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      role="listitem"
    >
      <div
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={cn(
          'group relative flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {isEditing ? (
          /* Inline edit mode */
          <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 bg-background border border-ring/50 rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={100}
              aria-label="Rename conversation"
            />
            <button
              onClick={handleConfirmEdit}
              className="text-green-500 hover:text-green-400 transition-colors"
              aria-label="Confirm rename"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel rename"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-xs font-medium truncate leading-5">
                {truncateText(conversation.title, 35)}
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 leading-4">
                {formatRelativeTime(conversation.updatedAt)}
              </span>
            </div>

            {/* Action buttons — visible on hover or active */}
            {(showActions || isActive) && (
              <div
                className="flex items-center gap-0.5 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleStartEdit}
                  className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-border"
                  aria-label="Rename conversation"
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  className="h-6 w-6 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
