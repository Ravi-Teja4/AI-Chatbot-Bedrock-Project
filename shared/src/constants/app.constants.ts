/**
 * Application Constants — Shared across frontend and backend
 */

export const APP_NAME = 'AI Chat Platform' as const;
export const APP_VERSION = '1.0.0' as const;

/** Message constraints — must match frontend ChatInput */
export const MESSAGE = {
  MAX_LENGTH: 4000,
  MIN_LENGTH: 1,
} as const;

/** Conversation constraints */
export const CONVERSATION = {
  TITLE_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 1,
  /** Max title characters shown in sidebar */
  SIDEBAR_TITLE_TRUNCATE: 35,
} as const;

/** Context window — number of messages sent to AI model */
export const AI = {
  /** Max messages included in Bedrock context window */
  CONTEXT_WINDOW_SIZE: 20,
  /** Placeholder model — replaced with real Bedrock model ID in Phase 6 */
  DEFAULT_MODEL_ID: 'placeholder',
} as const;

/** Supported theme values */
export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];
