/**
 * Conversation Model — DynamoDB Item Shape
 *
 * Table: aichat-conversations
 * PK: userId (String)
 * SK: conversationId (String — ULID)
 *
 * GSI: userId-updatedAt-index
 * - PK: userId
 * - SK: updatedAt (ISO timestamp)
 * - Purpose: sidebar history query sorted by most recently updated
 *
 * Design decisions:
 * - userId as PK groups all conversations per user in one partition
 * - ULID as SK provides unique IDs that sort chronologically
 * - updatedAt GSI enables efficient "get all conversations sorted by recency"
 * - messageCount is denormalized for sidebar display — avoids COUNT queries
 */

export interface ConversationItem {
  /** Partition key — DynamoDB userId */
  userId: string;
  /** Sort key — ULID (time-sortable unique identifier) */
  conversationId: string;
  /** Human-readable title — defaults to first message snippet */
  title: string;
  /** Denormalized message count for sidebar display */
  messageCount: number;
  /** ISO timestamp — also used as GSI sort key for recency ordering */
  createdAt: string;
  /** ISO timestamp — updated on every new message */
  updatedAt: string;
  /** Optional: conversation-level metadata for future features */
  metadata?: Record<string, unknown>;
}

/**
 * Domain Model — what the service layer works with
 * Identical to the DynamoDB item for now; separating them allows
 * future transformation (e.g., adding computed fields, hiding internal fields)
 */
export type Conversation = ConversationItem;

/** Data Transfer Object — what the API response returns */
export interface ConversationDTO {
  conversationId: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toConversationDTO(conversation: Conversation): ConversationDTO {
  return {
    conversationId: conversation.conversationId,
    userId: conversation.userId,
    title: conversation.title,
    messageCount: conversation.messageCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}
