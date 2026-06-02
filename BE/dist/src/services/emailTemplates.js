"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingPendingAdminTemplate = bookingPendingAdminTemplate;
exports.bookingConfirmedGuestTemplate = bookingConfirmedGuestTemplate;
exports.bookingCancelledGuestTemplate = bookingCancelledGuestTemplate;
exports.feedbackCreatedAdminTemplate = feedbackCreatedAdminTemplate;
const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
const formatDate = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(value);
const formatDateTime = (value) => value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
    : 'Không có';
function buildShell(title, body) {
    return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:18px;padding:24px;border:1px solid #e5e7eb;">
      <h1 style="margin:0 0 16px;color:#005899;font-size:22px;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">HenryTravel</p>
    </div>
  </div>
</body>
</html>`;
}
function bookingRows(data) {
    return `
    <p><strong>Mã booking:</strong> ${escapeHtml(data.bookingCode)}</p>
    <p><strong>Villa:</strong> ${escapeHtml(data.villaName)}${data.villaLocation ? ` — ${escapeHtml(data.villaLocation)}` : ''}</p>
    <p><strong>Khách:</strong> ${escapeHtml(data.guestName || 'N/A')}</p>
    <p><strong>SĐT:</strong> ${escapeHtml(data.guestPhone || 'N/A')}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.guestEmail || 'N/A')}</p>
    <p><strong>Check-in:</strong> ${escapeHtml(formatDate(data.checkIn))}</p>
    <p><strong>Check-out:</strong> ${escapeHtml(formatDate(data.checkOut))}</p>
    <p><strong>Số khách/phòng:</strong> ${escapeHtml(data.guestsCount)} khách / ${escapeHtml(data.roomsCount)} phòng</p>
  `;
}
function bookingPendingAdminTemplate(data) {
    const subject = `[HenryTravel] Booking mới chờ xác nhận ${data.bookingCode}`;
    const text = [
        'Booking mới chờ xác nhận',
        `Mã booking: ${data.bookingCode}`,
        `Villa: ${data.villaName}`,
        `Khách: ${data.guestName || 'N/A'}`,
        `SĐT: ${data.guestPhone || 'N/A'}`,
        `Email: ${data.guestEmail || 'N/A'}`,
        `Check-in: ${formatDate(data.checkIn)}`,
        `Check-out: ${formatDate(data.checkOut)}`,
        `Số khách/phòng: ${data.guestsCount}/${data.roomsCount}`,
        `Hết hạn giữ chỗ: ${formatDateTime(data.holdExpireAt)}`,
    ].join('\n');
    const html = buildShell('Booking mới chờ xác nhận', `${bookingRows(data)}<p><strong>Hết hạn giữ chỗ:</strong> ${escapeHtml(formatDateTime(data.holdExpireAt))}</p>`);
    return { subject, text, html };
}
function bookingConfirmedGuestTemplate(data) {
    const subject = `[HenryTravel] Booking ${data.bookingCode} đã được xác nhận`;
    const lookupUrl = process.env.PUBLIC_APP_URL ? `${process.env.PUBLIC_APP_URL.replace(/\/$/, '')}/booking/check` : '';
    const text = [
        `Chào ${data.guestName || 'quý khách'},`,
        `Booking ${data.bookingCode} đã được xác nhận.`,
        `Villa: ${data.villaName}`,
        `Check-in: ${formatDate(data.checkIn)}`,
        `Check-out: ${formatDate(data.checkOut)}`,
        lookupUrl ? `Tra cứu booking: ${lookupUrl}` : '',
    ].filter(Boolean).join('\n');
    const html = buildShell('Booking đã được xác nhận', `
    <p>Chào ${escapeHtml(data.guestName || 'quý khách')},</p>
    <p>Booking của quý khách đã được xác nhận.</p>
    ${bookingRows(data)}
    ${lookupUrl ? `<p><a href="${escapeHtml(lookupUrl)}" style="color:#005899;font-weight:bold;">Tra cứu booking</a></p>` : ''}
  `);
    return { subject, text, html };
}
function bookingCancelledGuestTemplate(data, reason) {
    const subject = `[HenryTravel] Booking ${data.bookingCode} đã bị hủy`;
    const text = [
        `Chào ${data.guestName || 'quý khách'},`,
        `Booking ${data.bookingCode} đã bị hủy.`,
        reason ? `Lý do: ${reason}` : '',
        `Villa: ${data.villaName}`,
        `Check-in: ${formatDate(data.checkIn)}`,
        `Check-out: ${formatDate(data.checkOut)}`,
    ].filter(Boolean).join('\n');
    const html = buildShell('Booking đã bị hủy', `
    <p>Chào ${escapeHtml(data.guestName || 'quý khách')},</p>
    <p>Booking của quý khách đã bị hủy.</p>
    ${reason ? `<p><strong>Lý do:</strong> ${escapeHtml(reason)}</p>` : ''}
    ${bookingRows(data)}
  `);
    return { subject, text, html };
}
function feedbackCreatedAdminTemplate(data) {
    const subject = `[HenryTravel] Feedback mới cho ${data.villaName}`;
    const preview = data.comment ? data.comment.slice(0, 500) : 'Không có nhận xét.';
    const text = [
        'Feedback mới',
        `Villa: ${data.villaName}`,
        `Mã booking: ${data.bookingCode}`,
        `Khách: ${data.guestName || 'N/A'}`,
        `Rating: ${data.rating}/5`,
        `Comment: ${preview}`,
    ].join('\n');
    const html = buildShell('Feedback mới', `
    <p><strong>Villa:</strong> ${escapeHtml(data.villaName)}</p>
    <p><strong>Mã booking:</strong> ${escapeHtml(data.bookingCode)}</p>
    <p><strong>Khách:</strong> ${escapeHtml(data.guestName || 'N/A')}</p>
    <p><strong>Rating:</strong> ${escapeHtml(data.rating)}/5</p>
    <p><strong>Comment:</strong> ${escapeHtml(preview)}</p>
  `);
    return { subject, text, html };
}
