import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { parseDate, parsePositiveInt } from '../../utils/validators';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const where: Prisma.AdminLogWhereInput = {};
    if (typeof req.query.adminId === 'string') where.adminId = req.query.adminId;
    if (typeof req.query.action === 'string') where.action = { contains: req.query.action, mode: 'insensitive' };
    if (typeof req.query.targetType === 'string') where.targetType = req.query.targetType;
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (from || to) where.timestamp = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    const [total, logs] = await Promise.all([
      prisma.adminLog.count({ where }),
      prisma.adminLog.findMany({ where, include: { admin: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { timestamp: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

export default router;
