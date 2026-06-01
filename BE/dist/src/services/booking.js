"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingCode = generateBookingCode;
exports.checkOverlap = checkOverlap;
exports.calculateHoldExpireAt = calculateHoldExpireAt;
exports.createBookingWithRetry = createBookingWithRetry;
exports.cancelExpiredPendingBooking = cancelExpiredPendingBooking;
exports.isPrismaKnownError = isPrismaKnownError;
const library_1 = require("@prisma/client/runtime/library");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
async function generateBookingCode() {
    const year = new Date().getFullYear();
    const prefix = `VB-${year}-`;
    const latest = await prisma_1.prisma.booking.findFirst({
        where: { bookingCode: { startsWith: prefix } },
        orderBy: { bookingCode: 'desc' },
        select: { bookingCode: true },
    });
    const codeParts = latest?.bookingCode.split('-') ?? [];
    const latestNumber = codeParts.length > 0 ? codeParts[codeParts.length - 1] : undefined;
    const nextNumber = latestNumber ? Number(latestNumber) + 1 : 1;
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}
async function checkOverlap(villaId, checkIn, checkOut, excludeBookingId) {
    const now = new Date();
    const overlap = await prisma_1.prisma.booking.findFirst({
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
function calculateHoldExpireAt(villa) {
    const holdMinutes = villa.holdMinutes && villa.holdMinutes > 0 ? villa.holdMinutes : 15;
    return new Date(Date.now() + holdMinutes * 60 * 1000);
}
async function createBookingWithRetry(data, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        const bookingCode = await generateBookingCode();
        try {
            return await prisma_1.prisma.booking.create({
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
        }
        catch (error) {
            const isDuplicateCode = error instanceof library_1.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                Array.isArray(error.meta?.target) &&
                (error.meta.target.includes('booking_code') ||
                    error.meta.target.includes('bookingCode'));
            if (!isDuplicateCode || attempt === maxRetries) {
                if (isDuplicateCode) {
                    throw new errors_1.AppError(500, 'BOOKING_CODE_GENERATION_FAILED', 'Không thể tạo mã đặt phòng. Vui lòng thử lại.');
                }
                throw error;
            }
        }
    }
    throw new errors_1.AppError(500, 'BOOKING_CODE_GENERATION_FAILED', 'Không thể tạo mã đặt phòng. Vui lòng thử lại.');
}
async function cancelExpiredPendingBooking(bookingId, note) {
    return prisma_1.prisma.$transaction([
        prisma_1.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'cancelled' },
        }),
        prisma_1.prisma.bookingHistory.create({
            data: {
                bookingId,
                status: 'cancelled',
                changedBy: 'system',
                note,
            },
        }),
    ]);
}
function isPrismaKnownError(error) {
    return error instanceof library_1.PrismaClientKnownRequestError;
}
