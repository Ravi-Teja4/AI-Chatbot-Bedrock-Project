import type { Request, Response, NextFunction } from 'express';
import { messageService } from '@/services/message.service';
import { sendSuccess, sendCreated } from '@/utils/response';
import { createLogger } from '@/utils/logger';
import type { SendMessageInput, ListMessagesQuery } from '@/validators/message.validator';

const log = createLogger('MessageController');

export class MessageController {
  /**
   * @swagger
   * /conversations/{conversationId}/messages:
   *   get:
   *     tags: [Messages]
   *     summary: List messages in a conversation
   *     parameters:
   *       - $ref: '#/components/parameters/ConversationId'
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/Cursor'
   *     responses:
   *       200:
   *         description: List of messages
   *       404:
   *         description: Conversation not found
   */
  async list(
    req: Request<{ conversationId: string }, object, object, ListMessagesQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await messageService.listMessages(
        req.userId,
        req.params.conversationId,
        req.query,
      );

      sendSuccess(res, result.messages, {
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
   * /conversations/{conversationId}/messages:
   *   post:
   *     tags: [Messages]
   *     summary: Send a message
   *     description: Sends a user message and returns both the user message and the AI response.
   *     parameters:
   *       - $ref: '#/components/parameters/ConversationId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content:
   *                 type: string
   *                 maxLength: 4000
   *     responses:
   *       201:
   *         description: Messages created (user + assistant)
   */
  async send(
    req: Request<{ conversationId: string }, object, SendMessageInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      log.info(
        {
          userId: req.userId,
          conversationId: req.params.conversationId,
          contentLength: req.body.content.length,
        },
        'Sending message',
      );

      const result = await messageService.sendMessage(
        req.userId,
        req.params.conversationId,
        req.body,
      );

      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const messageController = new MessageController();
