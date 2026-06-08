import { randomUUID } from 'crypto';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { bookingRateLimit } from '../middleware/rateLimit';
import {
  cancelExpiredPendingBooking,
  checkOverlap,
  createBookingWithRetry,
} from '../services/booking';
import { getBookingHoldMinutes } from '../services/settings';
import { buildZaloLinks } from '../services/zalo';
import { notifyAdminBookingPending } from '../services/notifications';
import { AppError } from '../utils/errors';
import { isValidDateRange, parseDate, parsePositiveInt } from '../utils/validators';

const router = Router();

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} là bắt buộc.`);
  }

  return value.trim();
}

function toBookingResponse(booking: {
  id: string;
  bookingCode: string;
  status: string;
  holdExpireAt: Date | null;
  guestName: string | null;
  guestPhone: string | null;
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  adultCount: number;
  childrenCount: number;
  infantCount: number;
}) {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    holdExpireAt: booking.holdExpireAt,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestsCount: booking.guestsCount,
    adultCount: booking.adultCount,
    childrenCount: booking.childrenCount,
    infantCount: booking.infantCount,
  };
}

function toBookingCheckResponse(booking: {
  id: string;
  bookingCode: string;
  villaId: string;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  adultCount: number;
  childrenCount: number;
  infantCount: number;
  roomsCount: number;
  specialRequest: string | null;
  status: string;
  source: string;
  holdExpireAt: Date | null;
  depositStatus: string;
  depositMethod: string | null;
  depositPaidAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    villaId: booking.villaId,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestsCount: booking.guestsCount,
    adultCount: booking.adultCount,
    childrenCount: booking.childrenCount,
    infantCount: booking.infantCount,
    roomsCount: booking.roomsCount,
    specialRequest: booking.specialRequest,
    status: booking.status,
    source: booking.source,
    holdExpireAt: booking.holdExpireAt,
    depositStatus: booking.depositStatus,
    depositMethod: booking.depositMethod,
    depositPaidAt: booking.depositPaidAt,
    createdAt: booking.createdAt,
  };
}

router.post('/', bookingRateLimit, async (req, res, next) => {
  try {
    const villaId = requireString(req.body.villaId, 'villaId');
    const guestName = requireString(req.body.guestName, 'guestName');
    const guestPhone = requireString(req.body.guestPhone, 'guestPhone');
    const guestEmail =
      typeof req.body.guestEmail === 'string' && req.body.guestEmail.trim()
        ? req.body.guestEmail.trim()
        : undefined;
    const checkIn = parseDate(req.body.checkIn);
    const checkOut = parseDate(req.body.checkOut);
    const adultCount = parsePositiveInt(req.body.adultCount ?? req.body.guestsCount, 1, 100);
    const childrenCount = parsePositiveInt(req.body.childrenCount, 0, 100);
    const infantCount = parsePositiveInt(req.body.infantCount, 0, 100);
    const guestsCount = adultCount + childrenCount + infantCount;
    const roomsCount = parsePositiveInt(req.body.roomsCount, 1, 100);
    const specialRequest =
      typeof req.body.specialRequest === 'string' && req.body.specialRequest.trim()
        ? req.body.specialRequest.trim()
        : undefined;

    if (!checkIn || !checkOut || !isValidDateRange(checkIn, checkOut)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Ngày nhận/trả phòng không hợp lệ.');
    }

    if (guestsCount <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Tổng số khách phải lớn hơn 0.');
    }

    const villa = await prisma.villa.findUnique({ where: { id: villaId } });
    if (!villa) {
      throw new AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
    }

    if (villa.status !== 'available') {
      throw new AppError(409, 'VILLA_UNAVAILABLE', 'Villa hiện không khả dụng.');
    }

    if (guestsCount > villa.maxGuests) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Số khách vượt quá sức chứa tối đa (${villa.maxGuests}).`
      );
    }

    const hasOverlap = await checkOverlap(villa.id, checkIn, checkOut);
    if (hasOverlap) {
      throw new AppError(409, 'DATE_OVERLAP', 'Villa đã có booking trong khoảng ngày này.');
    }

    const guestToken = randomUUID();
    const globalHoldMinutes = await getBookingHoldMinutes();
    const holdMinutes = globalHoldMinutes ?? 15;
    const holdExpireAt = new Date(Date.now() + holdMinutes * 60 * 1000);
    const booking = await createBookingWithRetry({
      villaId: villa.id,
      guestName,
      guestPhone,
      guestEmail,
      guestToken,
      checkIn,
      checkOut,
      guestsCount,
      adultCount,
      childrenCount,
      infantCount,
      roomsCount,
      specialRequest,
      holdExpireAt,
    });

    const zaloLinks = await buildZaloLinks({
      phone: guestPhone,
      villaName: villa.name,
      checkIn,
      checkOut,
      guestsCount,
      adultCount,
      childrenCount,
      infantCount,
      guestName,
      bookingCode: booking.bookingCode,
    });

    await prisma.$transaction([
      prisma.bookingHistory.create({
        data: {
          bookingId: booking.id,
          status: 'pending_hold',
          changedBy: 'system',
          note: 'Booking created by guest',
        },
      }),
      prisma.zaloMessage.create({
        data: {
          bookingId: booking.id,
          messageUrlMobile: zaloLinks.mobile,
          messageUrlWeb: zaloLinks.web,
          messageUrlFallback: zaloLinks.fallback,
        },
      }),
    ]);

    void notifyAdminBookingPending({ ...booking, villa });

    res.cookie('guest_token', guestToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(201).json({
      booking: toBookingResponse(booking),
      guestToken,
      zaloLinks,
      holdMinutes,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/check', async (req, res, next) => {
  try {
    const code = requireString(req.query.code, 'code');
    const phone = requireString(req.query.phone, 'phone');
    const now = new Date();

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: code,
        guestPhone: phone,
      },
      include: {
        villa: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
    }

    let responseBooking = booking;
    if (
      booking.status === 'pending_hold' &&
      booking.holdExpireAt &&
      booking.holdExpireAt.getTime() < now.getTime()
    ) {
      const [cancelledBooking] = await cancelExpiredPendingBooking(
        booking.id,
        'Auto-cancelled during lookup'
      );
      responseBooking = { ...cancelledBooking, villa: booking.villa };
    }

    const response: Record<string, unknown> = {
      booking: toBookingCheckResponse(responseBooking),
      villa: booking.villa,
    };

    if (
      responseBooking.status === 'pending_hold' &&
      responseBooking.holdExpireAt &&
      responseBooking.holdExpireAt.getTime() > now.getTime()
    ) {
      response.remainingMinutes = Math.max(
        0,
        Math.ceil((responseBooking.holdExpireAt.getTime() - now.getTime()) / 60_000)
      );
      response.zaloLinks = await buildZaloLinks({
        phone: responseBooking.guestPhone || phone,
        villaName: booking.villa.name,
        checkIn: responseBooking.checkIn,
        checkOut: responseBooking.checkOut,
        guestsCount: responseBooking.guestsCount,
        adultCount: responseBooking.adultCount,
        childrenCount: responseBooking.childrenCount,
        infantCount: responseBooking.infantCount,
        guestName: responseBooking.guestName || undefined,
        bookingCode: responseBooking.bookingCode,
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
