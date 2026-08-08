'use client';

import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Globe } from 'lucide-react';
import { ChatInput } from './ChatInput';

const SUGGESTED_PROMPTS = [
  {
    icon: Zap,
    title: 'Explain a concept',
    prompt: 'Explain how large language models work in simple terms',
  },
  {
    icon: Globe,
    title: 'Write code',
    prompt: 'Write a TypeScript function to debounce API calls',
  },
  {
    icon: Shield,
    title: 'Analyze & review',
    prompt: 'Review this architecture and suggest improvements',
  },
  {
    icon: Bot,
    title: 'Brainstorm ideas',
    prompt: 'Give me 10 ideas for improving developer productivity',
  },
] as const;

/**
 * WelcomeScreen — Empty state when no conversation is active
 *
 * Shows on /chat route. Design inspired by ChatGPT and Claude welcome screens:
 * - Central branding/logo
 * - Subtitle describing capabilities
 * - Suggestion cards for quick starts
 * - Chat input at the bottom (same as conversation view)
 */
export function WelcomeScreen() {
  return (
    <div className="flex h-full flex-col">
      {/* Centered welcome content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Bot className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              How can I help you today?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Ask me anything — I can write code, analyze data, explain concepts, and more.
            </p>
          </div>
        </motion.div>

        {/* Suggestion cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl"
        >
          {SUGGESTED_PROMPTS.map(({ icon: Icon, title, prompt }) => (
            <button
              key={title}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-border/80 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Suggested prompt: ${prompt}`}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors mt-0.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{prompt}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Chat input — identical positioning to conversation view */}
      <div className="w-full">
        <ChatInput conversationId={null} isLoading={false} />
      </div>
    </div>
  );
}
