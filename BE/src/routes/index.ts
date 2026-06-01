import { Router } from 'express';
import bookingsRouter from './bookings';
import villasRouter from './villas';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'henrytravel-api',
    timestamp: new Date().toISOString(),
  });
});

router.use('/bookings', bookingsRouter);
router.use('/villas', villasRouter);

export default router;
