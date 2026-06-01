"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const validators_1 = require("../../utils/validators");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const page = (0, validators_1.parsePositiveInt)(req.query.page, 1, 10000);
        const limit = (0, validators_1.parsePositiveInt)(req.query.limit, 20, 100);
        const where = {};
        if (typeof req.query.adminId === 'string')
            where.adminId = req.query.adminId;
        if (typeof req.query.action === 'string')
            where.action = { contains: req.query.action, mode: 'insensitive' };
        if (typeof req.query.targetType === 'string')
            where.targetType = req.query.targetType;
        const from = (0, validators_1.parseDate)(req.query.from);
        const to = (0, validators_1.parseDate)(req.query.to);
        if (from || to)
            where.timestamp = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        const [total, logs] = await Promise.all([
            prisma_1.prisma.adminLog.count({ where }),
            prisma_1.prisma.adminLog.findMany({ where, include: { admin: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { timestamp: 'desc' }, skip: (page - 1) * limit, take: limit }),
        ]);
        res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
