import { Router } from 'express';
import { adminAuthMiddleware } from '../../middleware/auth';
import authRouter from './auth';
import blockedDatesRouter from './blockedDates';
import bookingsRouter from './bookings';
import feedbacksRouter from './feedbacks';
import logsRouter from './logs';
import mediaRouter from './media';
import settingsRouter from './settings';
import statsRouter from './stats';
import uploadRouter from './upload';
import villaMediaRouter from './villaMedia';
import villasRouter from './villas';

const router = Router();

router.use('/auth', authRouter);
router.use('/villas', adminAuthMiddleware, villaMediaRouter);
router.use('/villas', adminAuthMiddleware, villasRouter);
router.use('/blocked-dates', adminAuthMiddleware, blockedDatesRouter);
router.use('/bookings', adminAuthMiddleware, bookingsRouter);
router.use('/feedbacks', adminAuthMiddleware, feedbacksRouter);
router.use('/logs', adminAuthMiddleware, logsRouter);
router.use('/settings', adminAuthMiddleware, settingsRouter);
router.use('/media', adminAuthMiddleware, mediaRouter);
router.use('/stats', adminAuthMiddleware, statsRouter);
router.use('/upload', adminAuthMiddleware, uploadRouter);

export default router;
