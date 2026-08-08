import { z } from 'zod';

/**
 * Message Validators — Zod Schemas
 */

/** Maximum message content length — matches frontend MAX_CHARS */
const MAX_CONTENT_LENGTH = 4000;

export const sendMessageSchema = z.object({
  content: z
    .string({
      required_error: 'Message content is required',
      invalid_type_error: 'Message content must be a string',
    })
    .min(1, 'Message content cannot be empty')
    .max(MAX_CONTENT_LENGTH, `Message content cannot exceed ${MAX_CONTENT_LENGTH} characters`)
    .trim(),

  /** Future: explicit role override (system messages, injected context) */
  role: z.enum(['user']).default('user'),
});

export const listMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const messageIdParamSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesSchema>;
export type MessageIdParam = z.infer<typeof messageIdParamSchema>;
