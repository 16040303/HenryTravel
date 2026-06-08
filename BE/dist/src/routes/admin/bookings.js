"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const booking_1 = require("../../services/booking");
const adminLog_1 = require("../../services/adminLog");
const errors_1 = require("../../utils/errors");
const validators_1 = require("../../utils/validators");
const notifications_1 = require("../../services/notifications");
const router = (0, express_1.Router)();
const statuses = ['pending_hold', 'confirmed', 'cancelled', 'completed'];
const sanitize = (booking) => {
    const { guestToken: _guestToken, ...data } = booking;
    return data;
};
const adminId = (req) => {
    if (!req.user?.id)
        throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
    return req.user.id;
};
const paramId = (req) => {
    const value = req.params.id;
    return Array.isArray(value) ? value[0] : value;
};
router.get('/', async (req, res, next) => {
    try {
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 20, 100);
        const where = {};
        if (typeof req.query.villaId === 'string')
            where.villaId = req.query.villaId;
        if (typeof req.query.status === 'string' && statuses.includes(req.query.status))
            where.status = req.query.status;
        if (typeof req.query.phone === 'string')
            where.guestPhone = { contains: req.query.phone };
        if (typeof req.query.code === 'string')
            where.bookingCode = { contains: req.query.code, mode: 'insensitive' };
        const from = (0, validators_1.parseDate)(req.query.from);
        const to = (0, validators_1.parseDate)(req.query.to);
        if (from || to)
            where.checkIn = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        const [total, bookings] = await Promise.all([
            prisma_1.prisma.booking.count({ where }),
            prisma_1.prisma.booking.findMany({ where, include: { villa: { select: { id: true, name: true, location: true, price: true, priceType: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        ]);
        res.json({ bookings: bookings.map(sanitize), total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
});
const CSV_DELIMITER = ';';
const escapeCsvValue = (value) => {
    if (value === null || value === undefined)
        return '';
    const text = value instanceof Date ? value.toISOString() : String(value);
    if (!/[;"\r\n]/.test(text))
        return text;
    return `"${text.replace(/"/g, '""')}"`;
};
router.get('/export', async (req, res, next) => {
    try {
        const where = {};
        if (typeof req.query.villaId === 'string')
            where.villaId = req.query.villaId;
        if (typeof req.query.status === 'string' && statuses.includes(req.query.status))
            where.status = req.query.status;
        if (typeof req.query.phone === 'string')
            where.guestPhone = { contains: req.query.phone };
        if (typeof req.query.code === 'string')
            where.bookingCode = { contains: req.query.code, mode: 'insensitive' };
        const from = (0, validators_1.parseDate)(req.query.from);
        const to = (0, validators_1.parseDate)(req.query.to);
        if (from || to)
            where.checkIn = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        const bookings = await prisma_1.prisma.booking.findMany({
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
    }
    catch (e) {
        next(e);
    }
});
async function updateStatus(req, status, note, action) {
    const id = paramId(req);
    const booking = await prisma_1.prisma.booking.findUnique({ where: { id }, include: { villa: true } });
    if (!booking)
        throw new errors_1.AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
    if (status === 'confirmed') {
        if (booking.status === 'cancelled' || booking.status === 'completed')
            throw new errors_1.AppError(409, 'INVALID_BOOKING_STATUS', 'Không thể xác nhận booking này.');
        const overlap = await (0, booking_1.checkOverlap)(booking.villaId, booking.checkIn, booking.checkOut, booking.id);
        if (overlap)
            throw new errors_1.AppError(409, 'DATE_OVERLAP', 'Đã có booking confirmed trùng ngày.');
    }
    if (status === 'cancelled' && booking.status === 'completed')
        throw new errors_1.AppError(409, 'INVALID_BOOKING_STATUS', 'Không thể hủy booking đã hoàn tất.');
    if (status === 'completed' && booking.status !== 'confirmed')
        throw new errors_1.AppError(409, 'INVALID_BOOKING_STATUS', 'Chỉ có thể hoàn tất booking đã confirmed.');
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({ where: { id: booking.id }, data: { status }, include: { villa: true } });
        await tx.bookingHistory.create({ data: { bookingId: booking.id, status, changedBy: adminId(req), note } });
        return b;
    });
    await (0, adminLog_1.logAdminAction)({ adminId: adminId(req), action, targetType: 'booking', targetId: booking.id, req });
    if (status === 'confirmed')
        void (0, notifications_1.notifyGuestBookingConfirmed)(updated);
    if (status === 'cancelled')
        void (0, notifications_1.notifyGuestBookingCancelled)(updated, note);
    return sanitize(updated);
}
router.put('/:id/confirm', async (req, res, next) => { try {
    res.json(await updateStatus(req, 'confirmed', 'Admin confirmed booking', 'CONFIRM_BOOKING'));
}
catch (e) {
    next(e);
} });
router.put('/:id/cancel', async (req, res, next) => { try {
    const reason = typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Admin cancelled booking';
    res.json(await updateStatus(req, 'cancelled', reason, 'CANCEL_BOOKING'));
}
catch (e) {
    next(e);
} });
router.put('/:id/complete', async (req, res, next) => { try {
    res.json(await updateStatus(req, 'completed', 'Booking completed', 'COMPLETE_BOOKING'));
}
catch (e) {
    next(e);
} });
router.get('/:id/history', async (req, res, next) => { try {
    const id = paramId(req);
    const booking = await prisma_1.prisma.booking.findUnique({ where: { id }, select: { id: true } });
    if (!booking)
        throw new errors_1.AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
    const history = await prisma_1.prisma.bookingHistory.findMany({ where: { bookingId: booking.id }, orderBy: { timestamp: 'asc' } });
    res.json({ history });
}
catch (e) {
    next(e);
} });
exports.default = router;
