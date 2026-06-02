import type { Booking, Feedback, Villa } from '@prisma/client';
import { getAdminEmails, sendEmailBestEffort } from './email';
import {
  bookingCancelledGuestTemplate,
  bookingConfirmedGuestTemplate,
  bookingPendingAdminTemplate,
  feedbackCreatedAdminTemplate,
} from './emailTemplates';

type BookingWithVilla = Booking & { villa: Pick<Villa, 'name' | 'location'> };
type FeedbackWithRelations = Feedback & {
  villa: Pick<Villa, 'name'>;
  booking: Pick<Booking, 'bookingCode' | 'guestName'>;
};

function toBookingEmailData(booking: BookingWithVilla) {
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

export async function notifyAdminBookingPending(booking: BookingWithVilla): Promise<void> {
  const recipients = getAdminEmails();
  if (recipients.length === 0) return;
  const template = bookingPendingAdminTemplate(toBookingEmailData(booking));
  await sendEmailBestEffort({ to: recipients, ...template }, { event: 'BOOKING_PENDING_ADMIN', bookingCode: booking.bookingCode });
}

export async function notifyGuestBookingConfirmed(booking: BookingWithVilla): Promise<void> {
  if (!booking.guestEmail) return;
  const template = bookingConfirmedGuestTemplate(toBookingEmailData(booking));
  await sendEmailBestEffort({ to: booking.guestEmail, ...template }, { event: 'BOOKING_CONFIRMED_GUEST', bookingCode: booking.bookingCode });
}

export async function notifyGuestBookingCancelled(booking: BookingWithVilla, reason?: string): Promise<void> {
  if (!booking.guestEmail) return;
  const template = bookingCancelledGuestTemplate(toBookingEmailData(booking), reason);
  await sendEmailBestEffort({ to: booking.guestEmail, ...template }, { event: 'BOOKING_CANCELLED_GUEST', bookingCode: booking.bookingCode });
}

export async function notifyAdminFeedbackCreated(feedback: FeedbackWithRelations): Promise<void> {
  const recipients = getAdminEmails();
  if (recipients.length === 0) return;
  const template = feedbackCreatedAdminTemplate({
    villaName: feedback.villa.name,
    bookingCode: feedback.booking.bookingCode,
    guestName: feedback.booking.guestName,
    rating: feedback.rating,
    comment: feedback.comment,
  });
  await sendEmailBestEffort({ to: recipients, ...template }, { event: 'FEEDBACK_CREATED_ADMIN', bookingCode: feedback.booking.bookingCode });
}
