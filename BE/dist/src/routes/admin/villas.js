"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const adminLog_1 = require("../../services/adminLog");
const errors_1 = require("../../utils/errors");
const validators_1 = require("../../utils/validators");
const router = (0, express_1.Router)();
const villaStatuses = ['available', 'maintenance', 'hidden'];
const priceTypes = ['fixed', 'contact'];
const accommodationTypes = ['villa', 'hotel_resort'];
function getAdminId(req) {
    if (!req.user?.id)
        throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
    return req.user.id;
}
function parseArray(value, field) {
    if (value === undefined)
        return undefined;
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', `${field} phải là mảng string.`);
    }
    return value;
}
function parseVillaData(body, partial = false) {
    const data = {};
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const location = typeof body.location === 'string' ? body.location.trim() : undefined;
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : undefined;
    const locationEn = typeof body.locationEn === 'string' ? body.locationEn.trim() : undefined;
    const descriptionEn = typeof body.descriptionEn === 'string' ? body.descriptionEn.trim() : undefined;
    const descriptionKo = typeof body.descriptionKo === 'string' ? body.descriptionKo.trim() : undefined;
    const status = typeof body.status === 'string' ? body.status : undefined;
    const priceTypeRaw = typeof body.priceType === 'string' ? body.priceType : undefined;
    const priceType = priceTypeRaw === 'per_night' ? 'fixed' : priceTypeRaw;
    const accommodationType = typeof body.accommodationType === 'string' ? body.accommodationType : undefined;
    const price = body.price === undefined ? undefined : Number(body.price);
    const priceMax = body.priceMax === undefined || body.priceMax === null || body.priceMax === '' ? null : Number(body.priceMax);
    const maxGuests = body.maxGuests === undefined ? undefined : Number(body.maxGuests);
    const depositAmount = body.depositAmount === undefined ? undefined : Number(body.depositAmount);
    if (body.images !== undefined)
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Không gửi images trong villa payload. Hãy dùng API media.');
    if (!partial && !name)
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'name là bắt buộc.');
    if (!partial && !location)
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'location là bắt buộc.');
    if (!partial && (price === undefined || !Number.isFinite(price) || price <= 0))
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'price phải lớn hơn 0.');
    if (!partial && (maxGuests === undefined || !Number.isInteger(maxGuests) || maxGuests <= 0))
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'maxGuests phải lớn hơn 0.');
    if (name !== undefined)
        data.name = name;
    if (location !== undefined)
        data.location = location;
    if (description !== undefined)
        data.description = description;
    if (nameEn !== undefined)
        data.nameEn = nameEn || null;
    if (locationEn !== undefined)
        data.locationEn = locationEn || null;
    if (descriptionEn !== undefined)
        data.descriptionEn = descriptionEn || null;
    if (descriptionKo !== undefined)
        data.descriptionKo = descriptionKo || null;
    if (price !== undefined) {
        if (!Number.isFinite(price) || price <= 0)
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'price phải lớn hơn 0.');
        data.price = price;
    }
    if (body.priceMax !== undefined) {
        if (priceMax === null) {
            data.priceMax = null;
        }
        else {
            if (!Number.isFinite(priceMax) || priceMax <= 0)
                throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'priceMax phải lớn hơn 0.');
            const basePrice = price !== undefined ? price : undefined;
            if (basePrice !== undefined && priceMax < basePrice)
                throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'priceMax phải lớn hơn hoặc bằng price.');
            data.priceMax = priceMax;
        }
    }
    if (status !== undefined) {
        if (!villaStatuses.includes(status))
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'status không hợp lệ.');
        data.status = status;
    }
    if (priceType !== undefined) {
        if (!priceTypes.includes(priceType))
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'priceType không hợp lệ.');
        data.priceType = priceType;
    }
    if (accommodationType !== undefined) {
        if (!accommodationTypes.includes(accommodationType))
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'accommodationType không hợp lệ.');
        data.accommodationType = accommodationType;
    }
    if (maxGuests !== undefined) {
        if (!Number.isInteger(maxGuests) || maxGuests <= 0)
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'maxGuests phải lớn hơn 0.');
        data.maxGuests = maxGuests;
    }
    if (typeof body.depositRequired === 'boolean')
        data.depositRequired = body.depositRequired;
    if (depositAmount !== undefined)
        data.depositAmount = Number.isFinite(depositAmount) ? depositAmount : null;
    const facilities = parseArray(body.facilities, 'facilities');
    if (facilities !== undefined)
        data.facilities = facilities;
    return data;
}
function addVillaStats(villa) {
    const bookings = villa.bookings ?? [];
    const feedbacks = villa.feedbacks ?? [];
    const avgRating = feedbacks.length ? Number((feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(1)) : 0;
    const mediaCover = villa.media?.[0] ?? null;
    const { bookings: _bookings, feedbacks: _feedbacks, media: _media, ...data } = villa;
    return { ...data, mediaCover, bookingCount: bookings.length, feedbackCount: feedbacks.length, avgRating };
}
router.get('/', async (req, res, next) => {
    try {
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 20, 100);
        const where = {};
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
        const status = typeof req.query.status === 'string' ? req.query.status : '';
        const accommodationType = typeof req.query.accommodationType === 'string' ? req.query.accommodationType : '';
        if (q)
            where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
        if (location)
            where.location = { contains: location, mode: 'insensitive' };
        if (status)
            where.status = status;
        if (accommodationType) {
            if (!accommodationTypes.includes(accommodationType))
                throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'accommodationType không hợp lệ.');
            where.accommodationType = accommodationType;
        }
        const [total, villas] = await Promise.all([
            prisma_1.prisma.villa.count({ where }),
            prisma_1.prisma.villa.findMany({
                where,
                include: {
                    bookings: { select: { id: true } },
                    feedbacks: { select: { rating: true } },
                    media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }], take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        res.json({ villas: villas.map(addVillaStats), total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const villa = await prisma_1.prisma.villa.create({ data: parseVillaData(req.body) });
        await (0, adminLog_1.logAdminAction)({ adminId: getAdminId(req), action: 'CREATE_VILLA', targetType: 'villa', targetId: villa.id, req });
        res.status(201).json(villa);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await prisma_1.prisma.villa.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
        const parsedData = parseVillaData(req.body, true);
        const villa = await prisma_1.prisma.villa.update({ where: { id: req.params.id }, data: parsedData });
        await (0, adminLog_1.logAdminAction)({ adminId: getAdminId(req), action: 'UPDATE_VILLA', targetType: 'villa', targetId: villa.id, req });
        res.json(villa);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma_1.prisma.villa.findUnique({ where: { id: req.params.id }, include: { media: true } });
        if (!existing)
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
        const activeCount = await prisma_1.prisma.booking.count({
            where: { villaId: req.params.id, OR: [{ status: 'confirmed' }, { status: 'pending_hold', holdExpireAt: { gt: new Date() } }] },
        });
        if (activeCount > 0)
            throw new errors_1.AppError(409, 'VILLA_HAS_ACTIVE_BOOKINGS', 'Villa đang có booking hoạt động.');
        await prisma_1.prisma.villa.delete({ where: { id: req.params.id } });
        for (const media of existing.media) {
            if (!media.publicId)
                continue;
            await prisma_1.prisma.cloudinaryCleanupJob.upsert({
                where: { publicId_url_status_resourceType: { publicId: media.publicId, url: media.secureUrl || media.url, status: 'pending', resourceType: media.type } },
                update: {},
                create: { publicId: media.publicId, resourceType: media.type, url: media.secureUrl || media.url, villaId: req.params.id, reason: 'Deleted villa' },
            });
        }
        await (0, adminLog_1.logAdminAction)({ adminId: getAdminId(req), action: 'DELETE_VILLA', targetType: 'villa', targetId: req.params.id, req });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
