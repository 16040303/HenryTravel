import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

export async function bookingRateLimit(req: Request, _res: Response, next: NextFunction) {
  try {
    const ipAddress = getClientIp(req);
    const phone = String(req.body?.guestPhone || req.body?.phone || '').trim();
    const villaId = String(req.body?.villaId || '').trim();
    const now = new Date();
    const ipWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const phoneWindowStart = new Date(now.getTime() - 60 * 60 * 1000);

    const [ipCount, phoneCount] = await Promise.all([
      prisma.bookingAttempt.count({
        where: {
          ipAddress,
          attemptedAt: { gte: ipWindowStart },
        },
      }),
      phone
        ? prisma.bookingAttempt.count({
            where: {
              phone,
              attemptedAt: { gte: phoneWindowStart },
            },
          })
        : Promise.resolve(0),
    ]);

    const maxIpAttempts = process.env.NODE_ENV === 'production' ? 3 : 30;
    const maxPhoneAttempts = process.env.NODE_ENV === 'production' ? 2 : 20;

    if (ipCount >= maxIpAttempts || phoneCount >= maxPhoneAttempts) {
      throw new AppError(
        429,
        'RATE_LIMITED',
        'Bạn đã gửi quá nhiều yêu cầu đặt phòng. Vui lòng thử lại sau.'
      );
    }

    await prisma.bookingAttempt.create({
      data: {
        ipAddress,
        phone,
        villaId,
      },
    });

    next();
  } catch (error) {
    next(error);
  }
}
