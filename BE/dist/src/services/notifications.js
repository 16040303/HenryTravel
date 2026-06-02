"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAdminBookingPending = notifyAdminBookingPending;
exports.notifyGuestBookingConfirmed = notifyGuestBookingConfirmed;
exports.notifyGuestBookingCancelled = notifyGuestBookingCancelled;
exports.notifyAdminFeedbackCreated = notifyAdminFeedbackCreated;
const email_1 = require("./email");
const emailTemplates_1 = require("./emailTemplates");
function toBookingEmailData(booking) {
    return {
        bookingCode: booking.bookingCode,
        villaName: booking.villa.name,
        villaLocation: booking.villa.location,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestsCount: booking.guestsCount,
        roomsCount: booking.roomsCount,
        holdExpireAt: booking.holdExpireAt,
    };
}
async function notifyAdminBookingPending(booking) {
    const recipients = (0, email_1.getAdminEmails)();
    if (recipients.length === 0)
        return;
    const template = (0, emailTemplates_1.bookingPendingAdminTemplate)(toBookingEmailData(booking));
    await (0, email_1.sendEmailBestEffort)({ to: recipients, ...template }, { event: 'BOOKING_PENDING_ADMIN', bookingCode: booking.bookingCode });
}
async function notifyGuestBookingConfirmed(booking) {
    if (!booking.guestEmail)
        return;
    const template = (0, emailTemplates_1.bookingConfirmedGuestTemplate)(toBookingEmailData(booking));
    await (0, email_1.sendEmailBestEffort)({ to: booking.guestEmail, ...template }, { event: 'BOOKING_CONFIRMED_GUEST', bookingCode: booking.bookingCode });
}
async function notifyGuestBookingCancelled(booking, reason) {
    if (!booking.guestEmail)
        return;
    const template = (0, emailTemplates_1.bookingCancelledGuestTemplate)(toBookingEmailData(booking), reason);
    await (0, email_1.sendEmailBestEffort)({ to: booking.guestEmail, ...template }, { event: 'BOOKING_CANCELLED_GUEST', bookingCode: booking.bookingCode });
}
async function notifyAdminFeedbackCreated(feedback) {
    const recipients = (0, email_1.getAdminEmails)();
    if (recipients.length === 0)
        return;
    const template = (0, emailTemplates_1.feedbackCreatedAdminTemplate)({
        villaName: feedback.villa.name,
        bookingCode: feedback.booking.bookingCode,
        guestName: feedback.booking.guestName,
        rating: feedback.rating,
        comment: feedback.comment,
    });
    await (0, email_1.sendEmailBestEffort)({ to: recipients, ...template }, { event: 'FEEDBACK_CREATED_ADMIN', bookingCode: feedback.booking.bookingCode });
}
