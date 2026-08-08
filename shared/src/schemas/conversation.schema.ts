import { z } from 'zod';

/**
 * Shared Conversation Zod Schemas
 *
 * These are the canonical validation schemas. The backend validator files
 * import and re-export these rather than defining duplicates.
 *
 * Benefits of sharing schemas:
 * - Frontend can validate forms with the same rules as the backend
 * - A single source of truth for field constraints (max length, etc.)
 * - Changes propagate to both sides via workspace package
 */

export const MAX_TITLE_LENGTH = 200;

export const createConversationSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`)
    .trim(),
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

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
