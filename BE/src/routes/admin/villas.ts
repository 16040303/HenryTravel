import { Router } from 'express';
import type { Prisma, PriceType, VillaStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';
import { parsePositiveInt } from '../../utils/validators';

const router = Router();
const villaStatuses: VillaStatus[] = ['available', 'maintenance', 'hidden'];
const priceTypes: PriceType[] = ['fixed', 'contact'];

function getAdminId(req: Express.Request): string {
  if (!req.user?.id) throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
  return req.user.id;
}

function parseArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} phải là mảng string.`);
  }
  return value;
}

function parseVillaData(body: Record<string, unknown>, partial = false): Prisma.VillaUncheckedCreateInput | Prisma.VillaUncheckedUpdateInput {
  const data: Prisma.VillaUncheckedCreateInput | Prisma.VillaUncheckedUpdateInput = {};
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const location = typeof body.location === 'string' ? body.location.trim() : undefined;
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;
  const status = typeof body.status === 'string' ? body.status : undefined;
  const priceTypeRaw = typeof body.priceType === 'string' ? body.priceType : undefined;
  const priceType = priceTypeRaw === 'per_night' ? 'fixed' : priceTypeRaw;
  const price = body.price === undefined ? undefined : Number(body.price);
  const maxGuests = body.maxGuests === undefined ? undefined : Number(body.maxGuests);
  const holdMinutes = body.holdMinutes === undefined ? undefined : Number(body.holdMinutes);
  const depositAmount = body.depositAmount === undefined ? undefined : Number(body.depositAmount);

  if (!partial && !name) throw new AppError(400, 'VALIDATION_ERROR', 'name là bắt buộc.');
  if (!partial && !location) throw new AppError(400, 'VALIDATION_ERROR', 'location là bắt buộc.');
  if (!partial && (price === undefined || !Number.isFinite(price) || price <= 0)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'price phải lớn hơn 0.');
  }
  if (!partial && (maxGuests === undefined || !Number.isInteger(maxGuests) || maxGuests <= 0)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'maxGuests phải lớn hơn 0.');
  }

  if (name !== undefined) data.name = name;
  if (location !== undefined) data.location = location;
  if (description !== undefined) data.description = description;
  if (price !== undefined) {
    if (!Number.isFinite(price) || price <= 0) throw new AppError(400, 'VALIDATION_ERROR', 'price phải lớn hơn 0.');
    data.price = price;
  }
  if (status !== undefined) {
    if (!villaStatuses.includes(status as VillaStatus)) throw new AppError(400, 'VALIDATION_ERROR', 'status không hợp lệ.');
    data.status = status as VillaStatus;
  }
  if (priceType !== undefined) {
    if (!priceTypes.includes(priceType as PriceType)) throw new AppError(400, 'VALIDATION_ERROR', 'priceType không hợp lệ.');
    data.priceType = priceType as PriceType;
  }
  if (maxGuests !== undefined) {
    if (!Number.isInteger(maxGuests) || maxGuests <= 0) throw new AppError(400, 'VALIDATION_ERROR', 'maxGuests phải lớn hơn 0.');
    data.maxGuests = maxGuests;
  }
  if (holdMinutes !== undefined) {
    if (!Number.isInteger(holdMinutes) || holdMinutes <= 0) throw new AppError(400, 'VALIDATION_ERROR', 'holdMinutes phải lớn hơn 0.');
    data.holdMinutes = holdMinutes;
  }
  if (typeof body.depositRequired === 'boolean') data.depositRequired = body.depositRequired;
  if (depositAmount !== undefined) data.depositAmount = Number.isFinite(depositAmount) ? depositAmount : null;

  const images = parseArray(body.images, 'images');
  const facilities = parseArray(body.facilities, 'facilities');
  if (images !== undefined) data.images = images;
  if (facilities !== undefined) data.facilities = facilities;

  return data;
}

function addVillaStats<T extends { bookings?: unknown[]; feedbacks?: { rating: number }[] }>(villa: T) {
  const bookings = villa.bookings ?? [];
  const feedbacks = villa.feedbacks ?? [];
  const avgRating = feedbacks.length
    ? Number((feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(1))
    : 0;
  const { bookings: _bookings, feedbacks: _feedbacks, ...data } = villa;
  return { ...data, bookingCount: bookings.length, feedbackCount: feedbacks.length, avgRating };
}

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const where: Prisma.VillaWhereInput = {};
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';

    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (status) where.status = status as VillaStatus;

    const [total, villas] = await Promise.all([
      prisma.villa.count({ where }),
      prisma.villa.findMany({
        where,
        include: { bookings: { select: { id: true } }, feedbacks: { select: { rating: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ villas: villas.map(addVillaStats), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const villa = await prisma.villa.create({ data: parseVillaData(req.body as Record<string, unknown>) as Prisma.VillaUncheckedCreateInput });
    await logAdminAction({ adminId: getAdminId(req), action: 'CREATE_VILLA', targetType: 'villa', targetId: villa.id, req });
    res.status(201).json(villa);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.villa.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
    const villa = await prisma.villa.update({ where: { id: req.params.id }, data: parseVillaData(req.body as Record<string, unknown>, true) as Prisma.VillaUncheckedUpdateInput });
    await logAdminAction({ adminId: getAdminId(req), action: 'UPDATE_VILLA', targetType: 'villa', targetId: villa.id, req });
    res.json(villa);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.villa.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
    const activeCount = await prisma.booking.count({
      where: {
        villaId: req.params.id,
        OR: [{ status: 'confirmed' }, { status: 'pending_hold', holdExpireAt: { gt: new Date() } }],
      },
    });
    if (activeCount > 0) throw new AppError(409, 'VILLA_HAS_ACTIVE_BOOKINGS', 'Villa đang có booking hoạt động.');
    await prisma.villa.delete({ where: { id: req.params.id } });
    await logAdminAction({ adminId: getAdminId(req), action: 'DELETE_VILLA', targetType: 'villa', targetId: req.params.id, req });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
