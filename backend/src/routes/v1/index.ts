import { Router } from 'express';
import healthRoutes from './health.routes';
import conversationRoutes from './conversation.routes';
import messageRoutes from './message.routes';

/**
 * API v1 Router
 *
 * All routes are versioned under /api/v1/.
 * When v2 is needed, create a new routes/v2/ directory and mount it
 * alongside this one in app.ts — no disruption to existing clients.
 */
const router: import('express').Router = Router();

router.use('/health', healthRoutes);
router.use('/conversations', conversationRoutes);
router.use('/conversations/:conversationId/messages', messageRoutes);

export default router;
