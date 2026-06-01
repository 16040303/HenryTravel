import type { Booking, Prisma, Villa } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export async function generateBookingCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VB-${year}-`;

  const latest = await prisma.booking.findFirst({
    where: { bookingCode: { startsWith: prefix } },
    orderBy: { bookingCode: 'desc' },
    select: { bookingCode: true },
  });

  const codeParts = latest?.bookingCode.split('-') ?? [];
  const latestNumber = codeParts.length > 0 ? codeParts[codeParts.length - 1] : undefined;
  const nextNumber = latestNumber ? Number(latestNumber) + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

export async function checkOverlap(
  villaId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const now = new Date();

  const overlap = await prisma.booking.findFirst({
    where: {
      villaId,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      OR: [
        { status: 'confirmed' },
        {
          status: 'pending_hold',
          holdExpireAt: { gt: now },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(overlap);
}

export function calculateHoldExpireAt(villa: Pick<Villa, 'holdMinutes'>): Date {
  const holdMinutes = villa.holdMinutes && villa.holdMinutes > 0 ? villa.holdMinutes : 15;
  return new Date(Date.now() + holdMinutes * 60 * 1000);
}

export interface CreateBookingInput {
  villaId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestToken: string;
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  roomsCount: number;
  specialRequest?: string;
  holdExpireAt: Date;
}

export async function createBookingWithRetry(
  data: CreateBookingInput,
  maxRetries = 3
): Promise<Booking> {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const bookingCode = await generateBookingCode();

    try {
      return await prisma.booking.create({
        data: {
          bookingCode,
          villaId: data.villaId,
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          guestEmail: data.guestEmail,
          guestToken: data.guestToken,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guestsCount: data.guestsCount,
          roomsCount: data.roomsCount,
          specialRequest: data.specialRequest,
          status: 'pending_hold',
          source: 'web',
          holdExpireAt: data.holdExpireAt,
        },
      });
    } catch (error) {
      const isDuplicateCode =
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray((error.meta as { target?: unknown })?.target) &&
        ((error.meta as { target: string[] }).target.includes('booking_code') ||
          (error.meta as { target: string[] }).target.includes('bookingCode'));

      if (!isDuplicateCode || attempt === maxRetries) {
        if (isDuplicateCode) {
          throw new AppError(
            500,
            'BOOKING_CODE_GENERATION_FAILED',
            'Không thể tạo mã đặt phòng. Vui lòng thử lại.'
          );
        }
        throw error;
      }
    }
  }

  throw new AppError(
    500,
    'BOOKING_CODE_GENERATION_FAILED',
    'Không thể tạo mã đặt phòng. Vui lòng thử lại.'
  );
}

export async function cancelExpiredPendingBooking(bookingId: string, note: string) {
  return prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    }),
    prisma.bookingHistory.create({
      data: {
        bookingId,
        status: 'cancelled',
        changedBy: 'system',
        note,
      },
    }),
  ]);
}

export function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}
