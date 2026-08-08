import { Router } from 'express';
import { healthController } from '@/controllers/health.controller';

const router: import('express').Router = Router();

router.get('/', (req, res) => healthController.liveness(req, res));
router.get('/detailed', (req, res, next) =>
  healthController.readiness(req, res).catch(next),
);

export default router;
