'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

/**
 * TypingIndicator — Animated dots shown while AI is generating
 *
 * Three bouncing dots with staggered delays — same pattern used by
 * ChatGPT, Claude, and most modern chat interfaces.
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 py-3"
      role="status"
      aria-label="AI is thinking"
    >
      {/* Avatar */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5"
        aria-hidden="true"
      >
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1 rounded-2xl px-4 py-3 bg-transparent">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </motion.div>
  );
}
