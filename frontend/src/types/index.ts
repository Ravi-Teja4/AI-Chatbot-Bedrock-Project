/**
 * Frontend Types Index
 *
 * Re-exports shared types from @ai-chat/shared for convenience.
 * Frontend components import from '@/types' rather than '@ai-chat/shared'
 * directly — this provides a single point to add frontend-specific
 * augmentations or overrides.
 */

export type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  Message,
  MessageRole,
  SendMessageRequest,
  PaginatedResponse,
  ApiResponse,
  ApiErrorResponse,
  PaginationMeta,
} from '@ai-chat/shared';

/**
 * Frontend-specific UI state types
 */

export interface ConversationGroup {
  label: string;
  conversations: import('@ai-chat/shared').Conversation[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ChatState {
  isTyping: boolean;
  streamingMessageId: string | null;
}
