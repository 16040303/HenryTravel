"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRateLimit = bookingRateLimit;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
        return forwardedFor[0].split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}
async function bookingRateLimit(req, _res, next) {
    try {
        const ipAddress = getClientIp(req);
        const phone = String(req.body?.guestPhone || req.body?.phone || '').trim();
        const villaId = String(req.body?.villaId || '').trim();
        const now = new Date();
        const ipWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
        const phoneWindowStart = new Date(now.getTime() - 60 * 60 * 1000);
        const [ipCount, phoneCount] = await Promise.all([
            prisma_1.prisma.bookingAttempt.count({
                where: {
                    ipAddress,
                    attemptedAt: { gte: ipWindowStart },
                },
            }),
            phone
                ? prisma_1.prisma.bookingAttempt.count({
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
            throw new errors_1.AppError(429, 'RATE_LIMITED', 'Bạn đã gửi quá nhiều yêu cầu đặt phòng. Vui lòng thử lại sau.');
        }
        await prisma_1.prisma.bookingAttempt.create({
            data: {
                ipAddress,
                phone,
                villaId,
            },
        });
        next();
    }
    catch (error) {
        next(error);
    }
}
