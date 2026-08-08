'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Bot, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn, copyToClipboard, formatRelativeTime } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface MessageItemProps {
  message: Message;
}

/**
 * MessageItem — Single chat message bubble
 *
 * User messages: right-aligned, darker bubble, plain text
 * Assistant messages: left-aligned with avatar, markdown rendered, copy button
 *
 * Markdown features:
 * - GitHub-flavored Markdown (tables, checkboxes, strikethrough)
 * - Syntax-highlighted code blocks via rehype-highlight
 * - Per-block copy button on code blocks
 */
export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('group flex gap-3 py-3', isUser ? 'justify-end' : 'justify-start')}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5"
          aria-hidden="true"
        >
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1 max-w-[85%]', isUser && 'items-end')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-7',
            isUser
              ? 'bg-secondary text-secondary-foreground rounded-br-sm'
              : 'bg-transparent text-foreground rounded-bl-sm',
          )}
        >
          {isUser ? (
            /* User messages: plain text, preserve line breaks */
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            /* Assistant messages: full markdown */
            <TooltipProvider delayDuration={300}>
              <div className="prose-chat">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Custom code block renderer with copy button
                    pre: ({ children, ...props }) => (
                      <CodeBlock {...props}>{children}</CodeBlock>
                    ),
                    // Inline code
                    code: ({ children, className, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code
                          className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[0.8em] font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Timestamp + copy action (assistant only) */}
        <div
          className={cn(
            'flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-[10px] text-muted-foreground/50">
            {formatRelativeTime(message.createdAt)}
          </span>
          {!isUser && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted mt-0.5"
          aria-hidden="true"
        >
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
 * CopyButton
 * ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="h-6 w-6 text-muted-foreground/50 hover:text-muted-foreground"
          aria-label={copied ? 'Copied!' : 'Copy message'}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------
 * CodeBlock — pre wrapper with language label + copy button
 * ------------------------------------------------------------------ */

function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const codeEl = (props as { ref?: React.RefObject<HTMLPreElement> })?.ref;
    // Extract text content from children
    const text = extractText(children);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-border/50">
      {/* Code block header */}
      <div className="flex items-center justify-between bg-muted/60 px-4 py-2 border-b border-border/30">
        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          code
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono bg-muted/30" {...props}>
        {children}
      </pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement).props.children as React.ReactNode);
  }
  return '';
}
