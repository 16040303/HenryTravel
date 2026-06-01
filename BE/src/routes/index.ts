import { Router } from 'express';
import adminRouter from './admin';
import bookingsRouter from './bookings';
import feedbacksRouter from './feedbacks';
import villasRouter from './villas';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'henrytravel-api',
    timestamp: new Date().toISOString(),
  });
});

router.use('/admin', adminRouter);
router.use('/bookings', bookingsRouter);
router.use('/feedbacks', feedbacksRouter);
router.use('/villas', villasRouter);

export default router;
