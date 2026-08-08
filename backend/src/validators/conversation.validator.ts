import { z } from 'zod';

/**
 * Conversation Validators — Zod Schemas
 *
 * These schemas serve dual purposes:
 * 1. Runtime validation in the validate() middleware
 * 2. TypeScript type inference — no need to maintain separate interface + schema
 */

/** Maximum conversation title length */
const MAX_TITLE_LENGTH = 200;

export const createConversationSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string',
    })
    .min(1, 'Title cannot be empty')
    .max(MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`)
    .trim(),

  /** Optional: set metadata at creation time */
  metadata: z.record(z.unknown()).optional(),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`)
    .trim()
    .optional(),
});

export const listConversationsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: z
    .string({
      required_error: 'conversationId parameter is required',
    })
    .min(1, 'conversationId cannot be empty'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsSchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
