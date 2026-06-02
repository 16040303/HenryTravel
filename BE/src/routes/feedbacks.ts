import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { notifyAdminFeedbackCreated } from '../services/notifications';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const bookingCode = typeof req.body.bookingCode === 'string' ? req.body.bookingCode.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : undefined;

    if (!bookingCode) throw new AppError(400, 'VALIDATION_ERROR', 'bookingCode là bắt buộc.');
    if (!phone) throw new AppError(400, 'VALIDATION_ERROR', 'phone là bắt buộc.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError(400, 'VALIDATION_ERROR', 'rating phải từ 1 đến 5.');
    if (comment && comment.length > 1000) throw new AppError(400, 'VALIDATION_ERROR', 'comment tối đa 1000 ký tự.');

    const booking = await prisma.booking.findFirst({ where: { bookingCode, guestPhone: phone }, include: { feedback: true } });
    if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
    if (booking.status !== 'confirmed' && booking.status !== 'completed') throw new AppError(403, 'FEEDBACK_NOT_ALLOWED', 'Booking chưa đủ điều kiện đánh giá.');
    if (booking.checkOut.getTime() >= Date.now()) throw new AppError(403, 'FEEDBACK_NOT_ALLOWED', 'Chỉ có thể đánh giá sau ngày check-out.');
    if (booking.feedback) throw new AppError(409, 'FEEDBACK_ALREADY_EXISTS', 'Booking này đã được đánh giá.');

    const feedback = await prisma.feedback.create({
      data: { bookingId: booking.id, villaId: booking.villaId, rating, comment, verified: true },
      include: { villa: { select: { name: true } }, booking: { select: { bookingCode: true, guestName: true } } },
    });
    void notifyAdminFeedbackCreated(feedback);
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
});

export default router;
