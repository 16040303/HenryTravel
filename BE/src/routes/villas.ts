import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { parseFacilities, parsePositiveInt } from '../utils/validators';

const router = Router();

function addStats<T extends { feedbacks?: { rating: number }[] }>(villa: T) {
  const feedbacks = villa.feedbacks ?? [];
  const feedbackCount = feedbacks.length;
  const avgRating = feedbackCount
    ? Number((feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbackCount).toFixed(1))
    : 0;

  const { feedbacks: _feedbacks, ...villaData } = villa;

  return {
    ...villaData,
    avgRating,
    feedbackCount,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const limit = parsePositiveInt(req.query.limit, 12, 50);
    const guests = parsePositiveInt(req.query.guests, 0, 1_000);
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const facilities = parseFacilities(req.query.facilities);

    const where: Prisma.VillaWhereInput = {
      status: 'available',
    };

    if (typeof req.query.location === 'string' && req.query.location.trim()) {
      where.location = {
        contains: req.query.location.trim(),
        mode: 'insensitive',
      };
    }

    if (guests > 0) {
      where.maxGuests = { gte: guests };
    }

    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {
        ...(Number.isNaN(minPrice) ? {} : { gte: minPrice }),
        ...(Number.isNaN(maxPrice) ? {} : { lte: maxPrice }),
      };
    }

    if (facilities.length > 0) {
      where.AND = facilities.map((facility) => ({
        facilities: {
          array_contains: facility,
        },
      }));
    }

    const [total, villas] = await Promise.all([
      prisma.villa.count({ where }),
      prisma.villa.findMany({
        where,
        include: {
          feedbacks: {
            where: { verified: true },
            select: { rating: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      villas: villas.map(addStats),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const villa = await prisma.villa.update({
      where: { id: req.params.id },
      data: { viewsCount: { increment: 1 } },
      include: {
        feedbacks: {
          where: { verified: true },
          select: { rating: true },
        },
      },
    }).catch(() => null);

    if (!villa) {
      throw new AppError(404, 'VILLA_NOT_FOUND', 'Villa not found');
    }

    res.json(addStats(villa));
  } catch (error) {
    next(error);
  }
});

export default router;
