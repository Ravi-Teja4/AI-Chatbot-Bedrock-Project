/**
 * Conversation Types — Shared between Frontend and Backend
 *
 * These match the ConversationDTO returned by the backend API.
 * The frontend consumes these types directly via the services layer.
 */

export interface Conversation {
  conversationId: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Request body for creating a new conversation */
export interface CreateConversationRequest {
  title: string;
  metadata?: Record<string, unknown>;
}

/** Request body for updating a conversation */
export interface UpdateConversationRequest {
  title?: string;
}

/**
 * Conversation group — used by frontend sidebar to group conversations
 * by time period (Today, Yesterday, Last 7 days, etc.)
 */
export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}
