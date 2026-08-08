import { Router } from 'express';
import { messageController } from '@/controllers/message.controller';
import { validate } from '@/middleware/validate.middleware';
import { requireAuth } from '@/middleware/auth.middleware';
import {
  sendMessageSchema,
  listMessagesSchema,
} from '@/validators/message.validator';
import { conversationIdParamSchema } from '@/validators/conversation.validator';

/**
 * Message routes are mounted under /conversations/:conversationId/messages
 * in the v1 index — mergeParams: true gives access to the parent :conversationId
 */
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get(
  '/',
  validate(conversationIdParamSchema, 'params'),
  validate(listMessagesSchema, 'query'),
  (req, res, next) => messageController.list(req as Parameters<typeof messageController.list>[0], res, next),
);

router.post(
  '/',
  validate(conversationIdParamSchema, 'params'),
  validate(sendMessageSchema, 'body'),
  (req, res, next) => messageController.send(req as Parameters<typeof messageController.send>[0], res, next),
);

export default router;
