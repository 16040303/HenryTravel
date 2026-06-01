"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseExpiredHolds = releaseExpiredHolds;
exports.cleanupBookingAttempts = cleanupBookingAttempts;
exports.startBookingJobs = startBookingJobs;
exports.stopBookingJobs = stopBookingJobs;
const prisma_1 = require("../lib/prisma");
const globalForJobs = globalThis;
async function releaseExpiredHolds() {
    try {
        const expiredBookings = await prisma_1.prisma.booking.findMany({
            where: {
                status: 'pending_hold',
                holdExpireAt: { lt: new Date() },
            },
            select: { id: true },
        });
        for (const booking of expiredBookings) {
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: 'cancelled' },
                }),
                prisma_1.prisma.bookingHistory.create({
                    data: {
                        bookingId: booking.id,
                        status: 'cancelled',
                        changedBy: 'system',
                        note: 'Auto-released: hold time expired',
                    },
                }),
            ]);
        }
        if (expiredBookings.length > 0) {
            console.log(`Released ${expiredBookings.length} expired booking hold(s).`);
        }
        return expiredBookings.length;
    }
    catch (error) {
        console.error('releaseExpiredHolds failed:', error);
        return 0;
    }
}
async function cleanupBookingAttempts() {
    try {
        const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await prisma_1.prisma.bookingAttempt.deleteMany({
            where: {
                attemptedAt: { lt: olderThan },
            },
        });
        if (result.count > 0) {
            console.log(`Cleaned ${result.count} old booking attempt(s).`);
        }
        return result.count;
    }
    catch (error) {
        console.error('cleanupBookingAttempts failed:', error);
        return 0;
    }
}
function startBookingJobs() {
    if (globalForJobs.bookingJobsStarted) {
        return;
    }
    globalForJobs.bookingJobsStarted = true;
    void releaseExpiredHolds();
    void cleanupBookingAttempts();
    globalForJobs.releaseHoldInterval = setInterval(() => {
        void releaseExpiredHolds();
    }, 60 * 1000);
    globalForJobs.cleanupAttemptsInterval = setInterval(() => {
        void cleanupBookingAttempts();
    }, 60 * 60 * 1000);
    console.log('Booking background jobs started.');
}
function stopBookingJobs() {
    if (globalForJobs.releaseHoldInterval) {
        clearInterval(globalForJobs.releaseHoldInterval);
    }
    if (globalForJobs.cleanupAttemptsInterval) {
        clearInterval(globalForJobs.cleanupAttemptsInterval);
    }
    globalForJobs.bookingJobsStarted = false;
}
