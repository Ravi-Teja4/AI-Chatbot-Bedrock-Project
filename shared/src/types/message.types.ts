/**
 * Message Types — Shared between Frontend and Backend
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  /** Future: token usage metadata from Bedrock */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Future: model identifier for multi-model support */
  modelId?: string;
}

/** Request body for sending a new message */
export interface SendMessageRequest {
  content: string;
  /** Defaults to 'user' — system role reserved for future injected context */
  role?: 'user';
}

/**
 * Response shape for POST /conversations/:id/messages
 * Returns both the user message and the AI response
 */
export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

/**
 * Streaming message chunk — used in Phase 6 for real-time streaming
 * Defined here now so the frontend can implement the UI contract
 * before the backend streaming endpoint is ready.
 */
export interface StreamChunk {
  type: 'delta' | 'done' | 'error';
  messageId: string;
  /** Present when type is 'delta' */
  content?: string;
  /** Present when type is 'error' */
  error?: string;
  /** Present when type is 'done' */
  finalContent?: string;
}
