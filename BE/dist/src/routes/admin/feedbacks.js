"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const adminLog_1 = require("../../services/adminLog");
const errors_1 = require("../../utils/errors");
const validators_1 = require("../../utils/validators");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 20, 100);
        const where = {};
        if (typeof req.query.villaId === 'string')
            where.villaId = req.query.villaId;
        if (typeof req.query.rating === 'string')
            where.rating = Number(req.query.rating);
        if (typeof req.query.verified === 'string')
            where.verified = req.query.verified === 'true';
        const [total, feedbacks, all] = await Promise.all([
            prisma_1.prisma.feedback.count({ where }),
            prisma_1.prisma.feedback.findMany({ where, include: { villa: { select: { id: true, name: true, location: true } }, booking: { select: { id: true, bookingCode: true, guestName: true, guestPhone: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            prisma_1.prisma.feedback.findMany({ where, select: { rating: true } }),
        ]);
        const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        for (const f of all)
            distribution[String(f.rating)] += 1;
        const avgRating = all.length ? Number((all.reduce((s, f) => s + f.rating, 0) / all.length).toFixed(1)) : 0;
        res.json({ feedbacks, stats: { avgRating, distribution }, total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
});
router.put('/:id/toggle', async (req, res, next) => {
    try {
        const feedback = await prisma_1.prisma.feedback.findUnique({ where: { id: req.params.id } });
        if (!feedback)
            throw new errors_1.AppError(404, 'FEEDBACK_NOT_FOUND', 'Không tìm thấy feedback.');
        const updated = await prisma_1.prisma.feedback.update({ where: { id: feedback.id }, data: { verified: !feedback.verified }, select: { id: true, verified: true } });
        await (0, adminLog_1.logAdminAction)({ adminId: req.user.id, action: 'TOGGLE_FEEDBACK', targetType: 'feedback', targetId: feedback.id, req });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
