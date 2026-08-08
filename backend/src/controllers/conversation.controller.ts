import type { Request, Response, NextFunction } from 'express';
import { conversationService } from '@/services/conversation.service';
import { sendSuccess, sendCreated, sendNoContent } from '@/utils/response';
import { createLogger } from '@/utils/logger';
import type {
  CreateConversationInput,
  UpdateConversationInput,
  ListConversationsQuery,
} from '@/validators/conversation.validator';

const log = createLogger('ConversationController');

/**
 * Conversation Controller — HTTP Layer
 *
 * Responsibilities:
 * - Extract validated data from request (params, body, query)
 * - Call the appropriate service method
 * - Format the response using sendSuccess/sendCreated/sendNoContent
 * - Pass errors to next() for the error middleware to handle
 *
 * What controllers do NOT do:
 * - Business logic (that's the service)
 * - Database access (that's the repository)
 * - Input validation (that's the validate middleware applied in routes)
 */
export class ConversationController {
  /**
   * @swagger
   * /conversations:
   *   get:
   *     tags: [Conversations]
   *     summary: List conversations
   *     description: Returns paginated list of conversations for the authenticated user, sorted by most recently updated.
   *     parameters:
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/Cursor'
   *     responses:
   *       200:
   *         description: List of conversations
   */
  async list(
    req: Request<object, object, object, ListConversationsQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await conversationService.listConversations(req.userId, req.query);

      sendSuccess(res, result.conversations, {
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          count: result.count,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /conversations:
   *   post:
   *     tags: [Conversations]
   *     summary: Create conversation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title]
   *             properties:
   *               title:
   *                 type: string
   *                 maxLength: 200
   *     responses:
   *       201:
   *         description: Conversation created
   */
  async create(
    req: Request<object, object, CreateConversationInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const conversation = await conversationService.createConversation(req.userId, req.body);

      log.info({ userId: req.userId, conversationId: conversation.conversationId }, 'Conversation created via API');

      sendCreated(res, conversation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /conversations/{conversationId}:
   *   get:
   *     tags: [Conversations]
   *     summary: Get conversation
   *     parameters:
   *       - $ref: '#/components/parameters/ConversationId'
   *     responses:
   *       200:
   *         description: Conversation details
   *       404:
   *         description: Conversation not found
   */
  async getById(
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const conversation = await conversationService.getConversation(
        req.userId,
        req.params.conversationId,
      );

      sendSuccess(res, conversation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /conversations/{conversationId}:
   *   patch:
   *     tags: [Conversations]
   *     summary: Update conversation title
   *     parameters:
   *       - $ref: '#/components/parameters/ConversationId'
   *     responses:
   *       200:
   *         description: Updated conversation
   */
  async update(
    req: Request<{ conversationId: string }, object, UpdateConversationInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const conversation = await conversationService.updateConversation(
        req.userId,
        req.params.conversationId,
        req.body,
      );

      sendSuccess(res, conversation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /conversations/{conversationId}:
   *   delete:
   *     tags: [Conversations]
   *     summary: Delete conversation
   *     parameters:
   *       - $ref: '#/components/parameters/ConversationId'
   *     responses:
   *       204:
   *         description: Conversation deleted
   */
  async delete(
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await conversationService.deleteConversation(req.userId, req.params.conversationId);

      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const conversationController = new ConversationController();
