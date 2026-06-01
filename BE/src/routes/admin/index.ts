import { Router } from 'express';
import { adminAuthMiddleware } from '../../middleware/auth';
import authRouter from './auth';
import bookingsRouter from './bookings';
import feedbacksRouter from './feedbacks';
import logsRouter from './logs';
import statsRouter from './stats';
import villasRouter from './villas';

const router = Router();

router.use('/auth', authRouter);
router.use('/villas', adminAuthMiddleware, villasRouter);
router.use('/bookings', adminAuthMiddleware, bookingsRouter);
router.use('/feedbacks', adminAuthMiddleware, feedbacksRouter);
router.use('/logs', adminAuthMiddleware, logsRouter);
router.use('/stats', adminAuthMiddleware, statsRouter);

export default router;
