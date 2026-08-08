import { Router } from 'express';
import { conversationController } from '@/controllers/conversation.controller';
import { validate } from '@/middleware/validate.middleware';
import { requireAuth } from '@/middleware/auth.middleware';
import {
  createConversationSchema,
  updateConversationSchema,
  listConversationsSchema,
  conversationIdParamSchema,
} from '@/validators/conversation.validator';

const router: import('express').Router = Router();

/**
 * All conversation routes are protected by requireAuth.
 * Phase 1: pass-through. Phase N: enforces Cognito token.
 */
router.use(requireAuth);

router.get('/', validate(listConversationsSchema, 'query'), (req, res, next) =>
  conversationController.list(req as Parameters<typeof conversationController.list>[0], res, next),
);

router.post('/', validate(createConversationSchema, 'body'), (req, res, next) =>
  conversationController.create(req as Parameters<typeof conversationController.create>[0], res, next),
);

router.get(
  '/:conversationId',
  validate(conversationIdParamSchema, 'params'),
  (req, res, next) =>
    conversationController.getById(
      req as Parameters<typeof conversationController.getById>[0],
      res,
      next,
    ),
);

router.patch(
  '/:conversationId',
  validate(conversationIdParamSchema, 'params'),
  validate(updateConversationSchema, 'body'),
  (req, res, next) =>
    conversationController.update(
      req as Parameters<typeof conversationController.update>[0],
      res,
      next,
    ),
);

router.delete(
  '/:conversationId',
  validate(conversationIdParamSchema, 'params'),
  (req, res, next) =>
    conversationController.delete(
      req as Parameters<typeof conversationController.delete>[0],
      res,
      next,
    ),
);

export default router;
