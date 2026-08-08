/**
 * Message Model — DynamoDB Item Shape
 *
 * Table: aichat-messages
 * PK: conversationId (String)
 * SK: messageId (String — ULID)
 *
 * Design decisions:
 * - PK=conversationId groups all messages of a conversation in one partition
 *   → single Query operation to fetch all messages in order
 * - ULID as SK sorts lexicographically by creation time — message ordering
 *   is the sort key itself, no separate timestamp sort required
 * - No GSI needed — only access pattern is "get messages for a conversation"
 * - Role uses discriminated union to support future system messages
 *
 * Access patterns supported:
 * 1. Get all messages for a conversation (paginated, chronological)
 *    → Query PK=conversationId, sorted ascending by SK (ULID)
 * 2. Get a specific message
 *    → GetItem PK=conversationId, SK=messageId
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageItem {
  /** Partition key */
  conversationId: string;
  /** Sort key — ULID ensures lexicographic time ordering */
  messageId: string;
  /** Who sent the message */
  role: MessageRole;
  /** Message text content — Markdown for assistant messages */
  content: string;
  /** ISO timestamp */
  createdAt: string;
  /** Future: token usage from Bedrock response */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Future: model identifier for multi-model support */
  modelId?: string;
  /** Future: streaming chunk metadata */
  isStreaming?: boolean;
}

export type Message = MessageItem;

export interface MessageDTO {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  modelId?: string;
}

export function toMessageDTO(message: Message): MessageDTO {
  return {
    messageId: message.messageId,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    ...(message.tokenUsage !== undefined ? { tokenUsage: message.tokenUsage } : {}),
    ...(message.modelId !== undefined ? { modelId: message.modelId } : {}),
  };
}
