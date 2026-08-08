/**
 * DynamoDB Table and Index Constants
 *
 * Centralizes all table names and index names. Table names are the suffix
 * passed to tableName() in aws.config.ts — the prefix is applied there.
 *
 * Never hardcode table names inline in repository files.
 */

export const TABLES = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  SETTINGS: 'settings',
  FEEDBACK: 'feedback',
} as const;

export const INDEXES = {
  CONVERSATIONS: {
    /** Query conversations by userId sorted by updatedAt (for sidebar history) */
    USER_UPDATED_AT: 'userId-updatedAt-index',
  },
  MESSAGES: {
    /** No additional GSI needed — PK=conversationId, SK=messageId (ULID, time-sortable) */
  },
  FEEDBACK: {
    /** Query feedback by userId */
    USER_ID: 'userId-index',
  },
} as const;

/** DynamoDB item TTL field name — used for future session/cache expiry */
export const TTL_FIELD = 'ttl';

/** Maximum items per DynamoDB Query/Scan page */
export const MAX_PAGE_SIZE = 100;

/** Default page size for list operations */
export const DEFAULT_PAGE_SIZE = 20;
