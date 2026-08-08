import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, tableName } from '@/config/aws.config';
import { DatabaseError, MessageNotFoundError } from '@/utils/errors';
import { encodeCursor } from '@/utils/pagination';
import { createLogger } from '@/utils/logger';
import type { MessageItem, MessageRole } from '@/models/message.model';

const log = createLogger('MessageRepository');

const TABLE = () => tableName('messages');

export interface ListMessagesResult {
  items: MessageItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Message Repository — DynamoDB Access Layer
 *
 * Key design: messageId is a ULID.
 * - ULIDs are lexicographically sortable by time
 * - Using ULID as the DynamoDB sort key means message order = sort key order
 * - No secondary index needed for chronological message retrieval
 * - No need to store and sort by a separate timestamp field
 */
export class MessageRepository {
  /**
   * Create a new message
   */
  async create(input: CreateMessageInput): Promise<MessageItem> {
    const now = new Date().toISOString();
    const messageId = ulid(); // ULID — time-sortable

    const item: MessageItem = {
      conversationId: input.conversationId,
      messageId,
      role: input.role,
      content: input.content,
      createdAt: now,
      ...(input.modelId !== undefined ? { modelId: input.modelId } : {}),
      ...(input.tokenUsage !== undefined ? { tokenUsage: input.tokenUsage } : {}),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE(),
          Item: item,
          ConditionExpression: 'attribute_not_exists(messageId)',
        }),
      );

      log.info(
        { conversationId: input.conversationId, messageId, role: input.role },
        'Message created',
      );
      return item;
    } catch (err) {
      log.error({ err, conversationId: input.conversationId }, 'Failed to create message');
      throw new DatabaseError('Failed to create message', err);
    }
  }

  /**
   * Get a single message by conversationId + messageId
   */
  async findById(conversationId: string, messageId: string): Promise<MessageItem> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE(),
          Key: { conversationId, messageId },
        }),
      );

      if (!result.Item) {
        throw new MessageNotFoundError(messageId);
      }

      return result.Item as MessageItem;
    } catch (err) {
      if (err instanceof MessageNotFoundError) throw err;
      log.error({ err, conversationId, messageId }, 'Failed to get message');
      throw new DatabaseError('Failed to retrieve message', err);
    }
  }

  /**
   * List messages for a conversation, chronologically (oldest first)
   * Uses direct PK query — no GSI needed since ULID sort key is time-ordered
   */
  async listByConversationId(
    conversationId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<ListMessagesResult> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE(),
          KeyConditionExpression: 'conversationId = :conversationId',
          ExpressionAttributeValues: { ':conversationId': conversationId },
          Limit: limit,
          ScanIndexForward: true, // Ascending — oldest first (natural conversation order)
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      const items = (result.Items ?? []) as MessageItem[];
      const hasMore = !!result.LastEvaluatedKey;
      const nextCursor = hasMore ? encodeCursor(result.LastEvaluatedKey!) : null;

      return { items, hasMore, nextCursor };
    } catch (err) {
      log.error({ err, conversationId }, 'Failed to list messages');
      throw new DatabaseError('Failed to list messages', err);
    }
  }

  /**
   * Get the last N messages in a conversation
   * Used for building AI context window (Phase 6 — Bedrock integration)
   */
  async getLastMessages(conversationId: string, count: number): Promise<MessageItem[]> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE(),
          KeyConditionExpression: 'conversationId = :conversationId',
          ExpressionAttributeValues: { ':conversationId': conversationId },
          Limit: count,
          ScanIndexForward: false, // Descending — most recent first
        }),
      );

      // Reverse to restore chronological order for context window
      return ((result.Items ?? []) as MessageItem[]).reverse();
    } catch (err) {
      log.error({ err, conversationId }, 'Failed to get last messages');
      throw new DatabaseError('Failed to retrieve context messages', err);
    }
  }
}

export const messageRepository = new MessageRepository();
