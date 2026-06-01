import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';
import { parsePositiveInt } from '../../utils/validators';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const where: Prisma.FeedbackWhereInput = {};
    if (typeof req.query.villaId === 'string') where.villaId = req.query.villaId;
    if (typeof req.query.rating === 'string') where.rating = Number(req.query.rating);
    if (typeof req.query.verified === 'string') where.verified = req.query.verified === 'true';

    const [total, feedbacks, all] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({ where, include: { villa: { select: { id: true, name: true, location: true } }, booking: { select: { id: true, bookingCode: true, guestName: true, guestPhone: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.feedback.findMany({ where, select: { rating: true } }),
    ]);
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>;
    for (const f of all) distribution[String(f.rating)] += 1;
    const avgRating = all.length ? Number((all.reduce((s, f) => s + f.rating, 0) / all.length).toFixed(1)) : 0;
    res.json({ feedbacks, stats: { avgRating, distribution }, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.put('/:id/toggle', async (req, res, next) => {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id } });
    if (!feedback) throw new AppError(404, 'FEEDBACK_NOT_FOUND', 'Không tìm thấy feedback.');
    const updated = await prisma.feedback.update({ where: { id: feedback.id }, data: { verified: !feedback.verified }, select: { id: true, verified: true } });
    await logAdminAction({ adminId: req.user!.id, action: 'TOGGLE_FEEDBACK', targetType: 'feedback', targetId: feedback.id, req });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
