import { z } from 'zod';

/**
 * Shared Message Zod Schemas
 *
 * MAX_MESSAGE_LENGTH must match the frontend ChatInput MAX_CHARS constant.
 * Defining it here as the single source of truth prevents divergence.
 */

export const MAX_MESSAGE_LENGTH = 4000;

export const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .min(1, 'Message content cannot be empty')
    .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
    .trim(),
  role: z.enum(['user']).default('user'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
