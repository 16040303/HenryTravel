"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const router = (0, express_1.Router)();
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day + 1);
    return d;
}
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function nights(checkIn, checkOut) {
    return Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
}
router.get('/', async (_req, res, next) => {
    try {
        const now = new Date();
        const weekStart = startOfWeek(now);
        const monthStart = startOfMonth(now);
        const [totalVillas, activeVillas, bookingsThisWeek, bookingsThisMonth, pendingBookings, confirmedBookings, cancelledBookings, completedBookings, newFeedbacks, revenueBookings, recentBookings, recentFeedbacks, villas] = await Promise.all([
            prisma_1.prisma.villa.count(),
            prisma_1.prisma.villa.count({ where: { status: 'available' } }),
            prisma_1.prisma.booking.count({ where: { createdAt: { gte: weekStart } } }),
            prisma_1.prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
            prisma_1.prisma.booking.count({ where: { status: 'pending_hold', holdExpireAt: { gt: now } } }),
            prisma_1.prisma.booking.count({ where: { status: 'confirmed' } }),
            prisma_1.prisma.booking.count({ where: { status: 'cancelled' } }),
            prisma_1.prisma.booking.count({ where: { status: 'completed' } }),
            prisma_1.prisma.feedback.count({ where: { createdAt: { gte: monthStart } } }),
            prisma_1.prisma.booking.findMany({ where: { status: { in: ['confirmed', 'completed'] } }, include: { villa: { select: { price: true } } } }),
            prisma_1.prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { villa: { select: { id: true, name: true, location: true } } } }),
            prisma_1.prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { villa: { select: { id: true, name: true } }, booking: { select: { bookingCode: true, guestName: true } } } }),
            prisma_1.prisma.villa.findMany({ include: { bookings: { select: { id: true } } } }),
        ]);
        const estimatedRevenue = revenueBookings.reduce((sum, booking) => sum + Number(booking.villa.price) * nights(booking.checkIn, booking.checkOut), 0);
        const topVillas = villas
            .map((villa) => ({ id: villa.id, name: villa.name, location: villa.location, bookingCount: villa.bookings.length }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);
        res.json({ totalVillas, activeVillas, bookingsThisWeek, bookingsThisMonth, pendingBookings, confirmedBookings, cancelledBookings, completedBookings, newFeedbacks, estimatedRevenue, topVillas, recentBookings, recentFeedbacks });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
