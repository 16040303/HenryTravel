import { Router } from 'express';
import villasRouter from './villas';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'henrytravel-api',
    timestamp: new Date().toISOString(),
  });
});

router.use('/villas', villasRouter);

export default router;
