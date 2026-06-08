import { Router } from 'express';
import type { Request } from 'express';
import type { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { checkOverlap } from '../../services/booking';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';
import { parseDate, parsePositiveInt } from '../../utils/validators';
import { notifyGuestBookingCancelled, notifyGuestBookingConfirmed } from '../../services/notifications';

const router = Router();
const statuses: BookingStatus[] = ['pending_hold', 'confirmed', 'cancelled', 'completed'];
const sanitize = <T extends { guestToken?: string | null }>(booking: T) => {
  const { guestToken: _guestToken, ...data } = booking;
  return data;
};
const adminId = (req: Request) => {
  if (!req.user?.id) throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
  return req.user.id;
};
const paramId = (req: Request): string => {
  const value = req.params.id;
  return Array.isArray(value) ? value[0] : value;
};

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const where: Prisma.BookingWhereInput = {};
    if (typeof req.query.villaId === 'string') where.villaId = req.query.villaId;
    if (typeof req.query.status === 'string' && statuses.includes(req.query.status as BookingStatus)) where.status = req.query.status as BookingStatus;
    if (typeof req.query.phone === 'string') where.guestPhone = { contains: req.query.phone };
    if (typeof req.query.code === 'string') where.bookingCode = { contains: req.query.code, mode: 'insensitive' };
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (from || to) where.checkIn = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({ where, include: { villa: { select: { id: true, name: true, location: true, price: true, priceType: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    res.json({ bookings: bookings.map(sanitize), total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

const CSV_DELIMITER = ';';

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[;"\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

router.get('/export', async (req, res, next) => {
  try {
    const where: Prisma.BookingWhereInput = {};
    if (typeof req.query.villaId === 'string') where.villaId = req.query.villaId;
    if (typeof req.query.status === 'string' && statuses.includes(req.query.status as BookingStatus)) where.status = req.query.status as BookingStatus;
    if (typeof req.query.phone === 'string') where.guestPhone = { contains: req.query.phone };
    if (typeof req.query.code === 'string') where.bookingCode = { contains: req.query.code, mode: 'insensitive' };
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (from || to) where.checkIn = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    const bookings = await prisma.booking.findMany({
      where,
      include: { villa: { select: { name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'booking_code',
      'villa_name',
      'villa_location',
      'guest_name',
      'guest_phone',
      'guest_email',
      'check_in',
      'check_out',
      'guests_count',
      'adult_count',
      'children_count',
      'infant_count',
      'rooms_count',
      'status',
      'created_at',
      'hold_expire_at',
    ];
    const rows = bookings.map((booking) => [
      booking.bookingCode,
      booking.villa.name,
      booking.villa.location,
      booking.guestName,
      booking.guestPhone,
      booking.guestEmail,
      booking.checkIn,
      booking.checkOut,
      booking.guestsCount,
      booking.adultCount,
      booking.childrenCount,
      booking.infantCount,
      booking.roomsCount,
      booking.status,
      booking.createdAt,
      booking.holdExpireAt,
    ].map(escapeCsvValue).join(CSV_DELIMITER));
    const csv = `\uFEFF${headers.join(CSV_DELIMITER)}\n${rows.join('\n')}`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="henrytravel-bookings-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

async function updateStatus(req: Request, status: BookingStatus, note: string, action: string) {
  const id = paramId(req);
  const booking = await prisma.booking.findUnique({ where: { id }, include: { villa: true } });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
  if (status === 'confirmed') {
    if (booking.status === 'cancelled' || booking.status === 'completed') throw new AppError(409, 'INVALID_BOOKING_STATUS', 'Không thể xác nhận booking này.');
    const overlap = await checkOverlap(booking.villaId, booking.checkIn, booking.checkOut, booking.id);
    if (overlap) throw new AppError(409, 'DATE_OVERLAP', 'Đã có booking confirmed trùng ngày.');
  }
  if (status === 'cancelled' && booking.status === 'completed') throw new AppError(409, 'INVALID_BOOKING_STATUS', 'Không thể hủy booking đã hoàn tất.');
  if (status === 'completed' && booking.status !== 'confirmed') throw new AppError(409, 'INVALID_BOOKING_STATUS', 'Chỉ có thể hoàn tất booking đã confirmed.');
  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id: booking.id }, data: { status }, include: { villa: true } });
    await tx.bookingHistory.create({ data: { bookingId: booking.id, status, changedBy: adminId(req), note } });
    return b;
  });
  await logAdminAction({ adminId: adminId(req), action, targetType: 'booking', targetId: booking.id, req });
  if (status === 'confirmed') void notifyGuestBookingConfirmed(updated);
  if (status === 'cancelled') void notifyGuestBookingCancelled(updated, note);
  return sanitize(updated);
}

router.put('/:id/confirm', async (req, res, next) => { try { res.json(await updateStatus(req, 'confirmed', 'Admin confirmed booking', 'CONFIRM_BOOKING')); } catch (e) { next(e); } });
router.put('/:id/cancel', async (req, res, next) => { try { const reason = typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Admin cancelled booking'; res.json(await updateStatus(req, 'cancelled', reason, 'CANCEL_BOOKING')); } catch (e) { next(e); } });
router.put('/:id/complete', async (req, res, next) => { try { res.json(await updateStatus(req, 'completed', 'Booking completed', 'COMPLETE_BOOKING')); } catch (e) { next(e); } });
router.get('/:id/history', async (req, res, next) => { try { const id = paramId(req); const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true } }); if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.'); const history = await prisma.bookingHistory.findMany({ where: { bookingId: booking.id }, orderBy: { timestamp: 'asc' } }); res.json({ history }); } catch (e) { next(e); } });

export default router;
