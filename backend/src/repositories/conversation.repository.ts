import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import { docClient, tableName } from '@/config/aws.config';
import { INDEXES } from '@/constants/dynamodb.constants';
import { DatabaseError, ConversationNotFoundError, isDynamoConditionalError } from '@/utils/errors';
import { encodeCursor } from '@/utils/pagination';
import { createLogger } from '@/utils/logger';
import type { ConversationItem } from '@/models/conversation.model';
import type { CreateConversationInput, UpdateConversationInput } from '@/validators/conversation.validator';

const log = createLogger('ConversationRepository');

const TABLE = () => tableName('conversations');

/**
 * Conversation Repository — DynamoDB Access Layer
 *
 * Clean Architecture: this is the ONLY place that knows about DynamoDB.
 * Services call this layer through its interface — they never import
 * DynamoDB SDK directly.
 *
 * All methods throw typed errors from utils/errors.ts rather than
 * leaking DynamoDB-specific exceptions to the service layer.
 */
export interface ListConversationsResult {
  items: ConversationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  async create(userId: string, input: CreateConversationInput): Promise<ConversationItem> {
    const now = new Date().toISOString();
    const conversationId = ulid();

    const item: ConversationItem = {
      userId,
      conversationId,
      title: input.title,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE(),
          Item: item,
          /* Prevent overwriting existing item with same ID (ULID collision — astronomically rare) */
          ConditionExpression: 'attribute_not_exists(conversationId)',
        }),
      );

      log.info({ userId, conversationId }, 'Conversation created');
      return item;
    } catch (err) {
      log.error({ err, userId, conversationId }, 'Failed to create conversation');
      throw new DatabaseError('Failed to create conversation', err);
    }
  }

  /**
   * Get a single conversation by userId + conversationId
   */
  async findById(userId: string, conversationId: string): Promise<ConversationItem> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE(),
          Key: { userId, conversationId },
        }),
      );

      if (!result.Item) {
        throw new ConversationNotFoundError(conversationId);
      }

      return result.Item as ConversationItem;
    } catch (err) {
      if (err instanceof ConversationNotFoundError) throw err;
      log.error({ err, userId, conversationId }, 'Failed to get conversation');
      throw new DatabaseError('Failed to retrieve conversation', err);
    }
  }

  /**
   * List conversations for a user, sorted by most recently updated
   * Uses the userId-updatedAt-index GSI
   */
  async listByUserId(
    userId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<ListConversationsResult> {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE(),
          IndexName: INDEXES.CONVERSATIONS.USER_UPDATED_AT,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
          Limit: limit,
          ScanIndexForward: false, // Descending — most recent first
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      const items = (result.Items ?? []) as ConversationItem[];
      const hasMore = !!result.LastEvaluatedKey;
      const nextCursor = hasMore ? encodeCursor(result.LastEvaluatedKey!) : null;

      return { items, hasMore, nextCursor };
    } catch (err) {
      log.error({ err, userId }, 'Failed to list conversations');
      throw new DatabaseError('Failed to list conversations', err);
    }
  }

  /**
   * Update conversation title
   */
  async update(
    userId: string,
    conversationId: string,
    input: UpdateConversationInput,
  ): Promise<ConversationItem> {
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = { ':updatedAt': now };
    const expressionNames: Record<string, string> = {};

    if (input.title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionValues[':title'] = input.title;
      expressionNames['#title'] = 'title'; // title is a reserved word in DynamoDB
    }

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: TABLE(),
          Key: { userId, conversationId },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeValues: expressionValues,
          ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
          ConditionExpression: 'attribute_exists(conversationId)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      log.info({ userId, conversationId }, 'Conversation updated');
      return result.Attributes as ConversationItem;
    } catch (err) {
      if (isDynamoConditionalError(err)) {
        throw new ConversationNotFoundError(conversationId);
      }
      log.error({ err, userId, conversationId }, 'Failed to update conversation');
      throw new DatabaseError('Failed to update conversation', err);
    }
  }

  /**
   * Increment message count (called when a new message is added)
   */
  async incrementMessageCount(userId: string, conversationId: string): Promise<void> {
    const now = new Date().toISOString();

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE(),
          Key: { userId, conversationId },
          UpdateExpression: 'SET messageCount = messageCount + :one, updatedAt = :updatedAt',
          ExpressionAttributeValues: { ':one': 1, ':updatedAt': now },
          ConditionExpression: 'attribute_exists(conversationId)',
        }),
      );
    } catch (err) {
      if (isDynamoConditionalError(err)) {
        throw new ConversationNotFoundError(conversationId);
      }
      throw new DatabaseError('Failed to increment message count', err);
    }
  }

  /**
   * Delete a conversation
   */
  async delete(userId: string, conversationId: string): Promise<void> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE(),
          Key: { userId, conversationId },
          ConditionExpression: 'attribute_exists(conversationId)',
        }),
      );

      log.info({ userId, conversationId }, 'Conversation deleted');
    } catch (err) {
      if (isDynamoConditionalError(err)) {
        throw new ConversationNotFoundError(conversationId);
      }
      log.error({ err, userId, conversationId }, 'Failed to delete conversation');
      throw new DatabaseError('Failed to delete conversation', err);
    }
  }
}

/** Singleton instance — injected into ConversationService */
export const conversationRepository = new ConversationRepository();
