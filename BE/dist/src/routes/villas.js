"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
const accommodationTypes = ['villa', 'hotel_resort'];
function getLang(value) {
    return value === 'en' || value === 'ko' ? value : 'vi';
}
function resolveVillaContent(villa, lang) {
    const resolved = { ...villa };
    if (lang === 'en') {
        resolved.name = villa.nameEn?.trim() || villa.name;
        resolved.location = villa.locationEn?.trim() || villa.location;
        resolved.description = villa.descriptionEn?.trim() || villa.description;
    }
    if (lang === 'ko') {
        resolved.name = villa.nameEn?.trim() || villa.name;
        resolved.location = villa.locationEn?.trim() || villa.location;
        resolved.description = villa.descriptionKo?.trim() || villa.descriptionEn?.trim() || villa.description;
    }
    return resolved;
}
function pickMediaCover(media) {
    const sorted = [...media].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
    return sorted.find((item) => item.isCover && item.type === 'image')
        || sorted.find((item) => item.type === 'image')
        || sorted.find((item) => item.type === 'video' && item.thumbnailUrl)
        || sorted.find((item) => item.thumbnailUrl)
        || null;
}
function addStats(villa, includeFullMedia = false) {
    const feedbacks = villa.feedbacks ?? [];
    const feedbackCount = feedbacks.length;
    const avgRating = feedbackCount ? Number((feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbackCount).toFixed(1)) : 0;
    const media = villa.media ?? [];
    const mediaCover = pickMediaCover(media);
    const { feedbacks: _feedbacks, media: _media, ...villaData } = villa;
    return {
        ...villaData,
        image: mediaCover?.thumbnailUrl || mediaCover?.secureUrl || mediaCover?.url || '',
        mediaCover,
        ...(includeFullMedia ? { media } : {}),
        avgRating,
        feedbackCount,
    };
}
router.get('/', async (req, res, next) => {
    try {
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 12, 50);
        const guests = (0, validators_1.parsePositiveInt)(req.query.guests, 0, 1000);
        const minPrice = Number(req.query.minPrice);
        const maxPrice = Number(req.query.maxPrice);
        const facilities = (0, validators_1.parseFacilities)(req.query.facilities);
        const lang = getLang(req.query.lang);
        const where = { status: 'available' };
        const accommodationType = typeof req.query.accommodationType === 'string' ? req.query.accommodationType.trim() : '';
        if (accommodationType) {
            if (!accommodationTypes.includes(accommodationType))
                throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'accommodationType không hợp lệ.');
            where.accommodationType = accommodationType;
        }
        if (typeof req.query.location === 'string' && req.query.location.trim())
            where.location = { contains: req.query.location.trim(), mode: 'insensitive' };
        if (guests > 0)
            where.maxGuests = { gte: guests };
        if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice))
            where.price = { ...(Number.isNaN(minPrice) ? {} : { gte: minPrice }), ...(Number.isNaN(maxPrice) ? {} : { lte: maxPrice }) };
        if (facilities.length > 0)
            where.AND = facilities.map((facility) => ({ facilities: { array_contains: facility } }));
        const [total, villas] = await Promise.all([
            prisma_1.prisma.villa.count({ where }),
            prisma_1.prisma.villa.findMany({
                where,
                include: {
                    feedbacks: { where: { verified: true }, select: { rating: true } },
                    media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        res.json({ villas: villas.map((villa) => addStats(resolveVillaContent(villa, lang), false)), total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/availability', async (req, res, next) => {
    try {
        const villa = await prisma_1.prisma.villa.findUnique({ where: { id: req.params.id }, select: { id: true } });
        if (!villa)
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Villa not found');
        const monthParam = typeof req.query.month === 'string' ? req.query.month : undefined;
        const now = new Date();
        const monthMatch = monthParam?.match(/^(\d{4})-(\d{2})$/);
        const year = monthMatch ? Number(monthMatch[1]) : now.getFullYear();
        const month = monthMatch ? Number(monthMatch[2]) : now.getMonth() + 1;
        if (month < 1 || month > 12)
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Tháng không hợp lệ. Định dạng đúng: YYYY-MM.');
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const [bookings, blockedDates] = await Promise.all([
            prisma_1.prisma.booking.findMany({ where: { villaId: villa.id, checkIn: { lt: monthEnd }, checkOut: { gt: monthStart }, OR: [{ status: 'confirmed' }, { status: 'pending_hold', holdExpireAt: { gt: now } }] }, select: { checkIn: true, checkOut: true, status: true } }),
            prisma_1.prisma.villaBlockedDate.findMany({ where: { villaId: villa.id, startDate: { lt: monthEnd }, endDate: { gt: monthStart } }, select: { startDate: true, endDate: true, reason: true } }),
        ]);
        const availability = Array.from({ length: daysInMonth }, (_, index) => {
            const dayStart = new Date(Date.UTC(year, month - 1, index + 1));
            const dayEnd = new Date(Date.UTC(year, month - 1, index + 2));
            const date = dayStart.toISOString().slice(0, 10);
            const overlapping = bookings.filter((booking) => booking.checkIn < dayEnd && booking.checkOut > dayStart);
            const overlappingBlock = blockedDates.find((blockedDate) => blockedDate.startDate < dayEnd && blockedDate.endDate > dayStart);
            const status = overlapping.some((booking) => booking.status === 'confirmed') ? 'booked' : overlapping.some((booking) => booking.status === 'pending_hold') ? 'pending' : overlappingBlock ? 'blocked' : 'available';
            return { date, status, ...(overlappingBlock ? { reason: overlappingBlock.reason } : {}) };
        });
        res.json({ availability });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/feedbacks', async (req, res, next) => {
    try {
        const villaId = req.params.id;
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 10, 50);
        const villa = await prisma_1.prisma.villa.findUnique({ where: { id: villaId }, select: { id: true } });
        if (!villa)
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Villa not found');
        const where = { villaId, verified: true };
        const [total, aggregate, feedbacks] = await Promise.all([
            prisma_1.prisma.feedback.count({ where }),
            prisma_1.prisma.feedback.aggregate({ where, _avg: { rating: true } }),
            prisma_1.prisma.feedback.findMany({ where, select: { id: true, villaId: true, bookingId: true, rating: true, comment: true, verified: true, createdAt: true, booking: { select: { guestName: true, bookingCode: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        ]);
        res.json({ feedbacks, avgRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0, total, page, totalPages: total === 0 ? 0 : Math.ceil(total / limit) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const lang = getLang(req.query.lang);
        const villa = await prisma_1.prisma.villa.update({
            where: { id: req.params.id },
            data: { viewsCount: { increment: 1 } },
            include: {
                feedbacks: { where: { verified: true }, select: { rating: true } },
                media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
            },
        }).catch(() => null);
        if (!villa)
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Villa not found');
        res.json(addStats(resolveVillaContent(villa, lang), true));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
