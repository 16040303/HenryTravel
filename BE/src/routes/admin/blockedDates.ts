import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { checkBlockedDateOverlap, checkBookingOverlap } from '../../services/booking';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';
import { parsePositiveInt } from '../../utils/validators';

const router = Router();

function getAdminId(req: Express.Request): string {
  if (!req.user?.id) throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
  return req.user.id;
}

function parseDateOnly(value: unknown, fieldName: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} phải có định dạng YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} không hợp lệ.`);
  }
  return date;
}

function publicSafeReason(value: unknown): string {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (!reason) throw new AppError(400, 'VALIDATION_ERROR', 'Lý do khóa lịch là bắt buộc.');
  return reason.slice(0, 120);
}

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const where: Prisma.VillaBlockedDateWhereInput = {};

    if (typeof req.query.villaId === 'string' && req.query.villaId.trim()) {
      where.villaId = req.query.villaId.trim();
    }

    if (typeof req.query.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)) {
      where.endDate = { gt: parseDateOnly(req.query.from, 'from') };
    }
    if (typeof req.query.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)) {
      where.startDate = { lt: parseDateOnly(req.query.to, 'to') };
    }

    const [total, blockedDates] = await Promise.all([
      prisma.villaBlockedDate.count({ where }),
      prisma.villaBlockedDate.findMany({
        where,
        include: {
          villa: { select: { id: true, name: true, location: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      blockedDates,
      total,
      page,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const adminId = getAdminId(req);
    const villaId = typeof req.body.villaId === 'string' ? req.body.villaId.trim() : '';
    const startDate = parseDateOnly(req.body.startDate, 'startDate');
    const endDate = parseDateOnly(req.body.endDate, 'endDate');
    const reason = publicSafeReason(req.body.reason);
    const note = typeof req.body.note === 'string' && req.body.note.trim()
      ? req.body.note.trim().slice(0, 500)
      : null;

    if (!villaId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Villa là bắt buộc.');
    }
    if (startDate >= endDate) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.');
    }

    const villa = await prisma.villa.findUnique({ where: { id: villaId }, select: { id: true } });
    if (!villa) {
      throw new AppError(404, 'VILLA_NOT_FOUND', 'Villa không tồn tại.');
    }

    const [bookingOverlap, blockedOverlap] = await Promise.all([
      checkBookingOverlap(villaId, startDate, endDate),
      checkBlockedDateOverlap(villaId, startDate, endDate),
    ]);

    if (bookingOverlap) {
      throw new AppError(409, 'DATE_OVERLAP', 'Khoảng ngày này đang có booking active.');
    }
    if (blockedOverlap) {
      throw new AppError(409, 'BLOCKED_DATE_OVERLAP', 'Khoảng ngày này đã bị khóa trước đó.');
    }

    const blockedDate = await prisma.villaBlockedDate.create({
      data: { villaId, startDate, endDate, reason, note, createdBy: adminId },
      include: {
        villa: { select: { id: true, name: true, location: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    await logAdminAction({
      adminId,
      action: 'CREATE_BLOCKED_DATE',
      targetType: 'villa_blocked_date',
      targetId: blockedDate.id,
      req,
    });

    res.status(201).json(blockedDate);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const adminId = getAdminId(req);
    const existing = await prisma.villaBlockedDate.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError(404, 'BLOCKED_DATE_NOT_FOUND', 'Khoảng khóa lịch không tồn tại.');
    }

    await prisma.villaBlockedDate.delete({ where: { id: existing.id } });
    await logAdminAction({
      adminId,
      action: 'DELETE_BLOCKED_DATE',
      targetType: 'villa_blocked_date',
      targetId: existing.id,
      req,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
