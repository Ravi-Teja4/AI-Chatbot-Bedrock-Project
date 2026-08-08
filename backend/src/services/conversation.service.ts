import {
  conversationRepository,
  type ListConversationsResult,
} from '@/repositories/conversation.repository';
import { toConversationDTO, type ConversationDTO } from '@/models/conversation.model';
import { parsePaginationParams } from '@/utils/pagination';
import { createLogger } from '@/utils/logger';
import type { CreateConversationInput, UpdateConversationInput } from '@/validators/conversation.validator';

const log = createLogger('ConversationService');

/**
 * Conversation Service — Business Logic Layer
 *
 * This layer sits between controllers and repositories.
 * It contains orchestration logic but no HTTP or database concerns.
 *
 * Current responsibilities:
 * - Delegate CRUD to ConversationRepository
 * - Map domain models to DTOs for API responses
 * - Enforce business rules (e.g., user can only access their own conversations)
 *
 * Future responsibilities (Phase 6):
 * - Auto-generate conversation title from first message via Bedrock
 * - Archive/restore conversations
 * - Conversation sharing — validate share tokens
 */

export interface ListConversationsServiceResult {
  conversations: ConversationDTO[];
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export class ConversationService {
  async createConversation(
    userId: string,
    input: CreateConversationInput,
  ): Promise<ConversationDTO> {
    log.info({ userId, title: input.title }, 'Creating conversation');

    const conversation = await conversationRepository.create(userId, input);
    return toConversationDTO(conversation);
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationDTO> {
    const conversation = await conversationRepository.findById(userId, conversationId);

    // Business rule: users can only access their own conversations
    // This check is redundant with DynamoDB PK partitioning but is an explicit guard
    if (conversation.userId !== userId) {
      log.warn({ userId, conversationId, ownerId: conversation.userId }, 'Unauthorized access attempt');
      // Import ForbiddenError inline to avoid circular deps in simple cases
      const { ForbiddenError } = await import('@/utils/errors');
      throw new ForbiddenError('Access denied to this conversation');
    }

    return toConversationDTO(conversation);
  }

  async listConversations(
    userId: string,
    queryParams: { limit?: unknown; cursor?: unknown },
  ): Promise<ListConversationsServiceResult> {
    const { limit, exclusiveStartKey } = parsePaginationParams(queryParams);

    const result: ListConversationsResult = await conversationRepository.listByUserId(
      userId,
      limit,
      exclusiveStartKey,
    );

    return {
      conversations: result.items.map(toConversationDTO),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      count: result.items.length,
    };
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    input: UpdateConversationInput,
  ): Promise<ConversationDTO> {
    // Verify ownership before updating
    await conversationRepository.findById(userId, conversationId);

    const updated = await conversationRepository.update(userId, conversationId, input);
    return toConversationDTO(updated);
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    // Verify ownership before deleting
    await conversationRepository.findById(userId, conversationId);

    await conversationRepository.delete(userId, conversationId);

    log.info({ userId, conversationId }, 'Conversation deleted by user');

    // Future: also delete all messages for this conversation
    // await messageRepository.deleteByConversationId(conversationId);
  }
}

export const conversationService = new ConversationService();
