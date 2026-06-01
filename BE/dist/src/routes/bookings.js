"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const rateLimit_1 = require("../middleware/rateLimit");
const booking_1 = require("../services/booking");
const zalo_1 = require("../services/zalo");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
function requireString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', `${field} là bắt buộc.`);
    }
    return value.trim();
}
function toBookingResponse(booking) {
    return {
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        holdExpireAt: booking.holdExpireAt,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
    };
}
function toBookingCheckResponse(booking) {
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
router.post('/', rateLimit_1.bookingRateLimit, async (req, res, next) => {
    try {
        const villaId = requireString(req.body.villaId, 'villaId');
        const guestName = requireString(req.body.guestName, 'guestName');
        const guestPhone = requireString(req.body.guestPhone, 'guestPhone');
        const guestEmail = typeof req.body.guestEmail === 'string' && req.body.guestEmail.trim()
            ? req.body.guestEmail.trim()
            : undefined;
        const checkIn = (0, validators_1.parseDate)(req.body.checkIn);
        const checkOut = (0, validators_1.parseDate)(req.body.checkOut);
        const guestsCount = Number(req.body.guestsCount);
        const roomsCount = (0, validators_1.parsePositiveInt)(req.body.roomsCount, 1, 100);
        const specialRequest = typeof req.body.specialRequest === 'string' && req.body.specialRequest.trim()
            ? req.body.specialRequest.trim()
            : undefined;
        if (!checkIn || !checkOut || !(0, validators_1.isValidDateRange)(checkIn, checkOut)) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Ngày nhận/trả phòng không hợp lệ.');
        }
        if (!Number.isInteger(guestsCount) || guestsCount <= 0) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Số khách phải lớn hơn 0.');
        }
        const villa = await prisma_1.prisma.villa.findUnique({ where: { id: villaId } });
        if (!villa) {
            throw new errors_1.AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy villa.');
        }
        if (villa.status !== 'available') {
            throw new errors_1.AppError(409, 'VILLA_UNAVAILABLE', 'Villa hiện không khả dụng.');
        }
        if (guestsCount > villa.maxGuests) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', `Số khách vượt quá sức chứa tối đa (${villa.maxGuests}).`);
        }
        const hasOverlap = await (0, booking_1.checkOverlap)(villa.id, checkIn, checkOut);
        if (hasOverlap) {
            throw new errors_1.AppError(409, 'DATE_OVERLAP', 'Villa đã có booking trong khoảng ngày này.');
        }
        const guestToken = (0, crypto_1.randomUUID)();
        const holdExpireAt = (0, booking_1.calculateHoldExpireAt)(villa);
        const booking = await (0, booking_1.createBookingWithRetry)({
            villaId: villa.id,
            guestName,
            guestPhone,
            guestEmail,
            guestToken,
            checkIn,
            checkOut,
            guestsCount,
            roomsCount,
            specialRequest,
            holdExpireAt,
        });
        const zaloLinks = await (0, zalo_1.buildZaloLinks)({
            phone: guestPhone,
            villaName: villa.name,
            checkIn,
            checkOut,
            guestsCount,
            guestName,
            bookingCode: booking.bookingCode,
        });
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.bookingHistory.create({
                data: {
                    bookingId: booking.id,
                    status: 'pending_hold',
                    changedBy: 'system',
                    note: 'Booking created by guest',
                },
            }),
            prisma_1.prisma.zaloMessage.create({
                data: {
                    bookingId: booking.id,
                    messageUrlMobile: zaloLinks.mobile,
                    messageUrlWeb: zaloLinks.web,
                    messageUrlFallback: zaloLinks.fallback,
                },
            }),
        ]);
        res.cookie('guest_token', guestToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(201).json({
            booking: toBookingResponse(booking),
            guestToken,
            zaloLinks,
            holdMinutes: villa.holdMinutes || 15,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/check', async (req, res, next) => {
    try {
        const code = requireString(req.query.code, 'code');
        const phone = requireString(req.query.phone, 'phone');
        const now = new Date();
        const booking = await prisma_1.prisma.booking.findFirst({
            where: {
                bookingCode: code,
                guestPhone: phone,
            },
            include: {
                villa: true,
            },
        });
        if (!booking) {
            throw new errors_1.AppError(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy booking.');
        }
        let responseBooking = booking;
        if (booking.status === 'pending_hold' &&
            booking.holdExpireAt &&
            booking.holdExpireAt.getTime() < now.getTime()) {
            const [cancelledBooking] = await (0, booking_1.cancelExpiredPendingBooking)(booking.id, 'Auto-cancelled during lookup');
            responseBooking = { ...cancelledBooking, villa: booking.villa };
        }
        const response = {
            booking: toBookingCheckResponse(responseBooking),
            villa: booking.villa,
        };
        if (responseBooking.status === 'pending_hold' &&
            responseBooking.holdExpireAt &&
            responseBooking.holdExpireAt.getTime() > now.getTime()) {
            response.remainingMinutes = Math.max(0, Math.ceil((responseBooking.holdExpireAt.getTime() - now.getTime()) / 60000));
            response.zaloLinks = await (0, zalo_1.buildZaloLinks)({
                phone: responseBooking.guestPhone || phone,
                villaName: booking.villa.name,
                checkIn: responseBooking.checkIn,
                checkOut: responseBooking.checkOut,
                guestsCount: responseBooking.guestsCount,
                guestName: responseBooking.guestName || undefined,
                bookingCode: responseBooking.bookingCode,
            });
        }
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
