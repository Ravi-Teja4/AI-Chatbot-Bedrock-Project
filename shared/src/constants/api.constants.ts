/**
 * API Constants — Shared endpoint paths and configuration
 *
 * Frontend services import these to construct API URLs without hardcoding strings.
 * Versioned paths ensure frontend and backend stay in sync.
 */

export const API_VERSION = 'v1' as const;
export const API_BASE = `/api/${API_VERSION}` as const;

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  HEALTH_DETAILED: `${API_BASE}/health/detailed`,

  CONVERSATIONS: `${API_BASE}/conversations`,
  CONVERSATION: (id: string) => `${API_BASE}/conversations/${id}`,

  MESSAGES: (conversationId: string) =>
    `${API_BASE}/conversations/${conversationId}/messages`,
  MESSAGE: (conversationId: string, messageId: string) =>
    `${API_BASE}/conversations/${conversationId}/messages/${messageId}`,
} as const;

/** Default pagination limits */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CONVERSATIONS_LIMIT: 30,
  MESSAGES_LIMIT: 50,
} as const;
