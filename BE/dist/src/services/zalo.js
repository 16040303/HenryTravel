"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildZaloLinks = buildZaloLinks;
function cleanPhone(phone) {
    return phone.replace(/[^0-9]/g, '');
}
function formatDate(date) {
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
function buildZaloLinks(params) {
    const phone = cleanPhone(process.env.ZALO_PHONE || params.phone);
    const message = [
        `Xin chào, tôi vừa đặt giữ chỗ villa ${params.villaName}.`,
        `Mã đặt phòng: ${params.bookingCode}`,
        `Ngày nhận phòng: ${formatDate(params.checkIn)}`,
        `Ngày trả phòng: ${formatDate(params.checkOut)}`,
        `Số khách: ${params.guestsCount}`,
        'Nhờ admin kiểm tra và xác nhận giúp tôi.',
    ].join('\n');
    const encodedMessage = encodeURIComponent(message);
    return {
        phone,
        message,
        mobile: `zalo://conversation?phone=${phone}`,
        web: `https://zalo.me/${phone}`,
        fallback: `https://zalo.me/${phone}?text=${encodedMessage}`,
    };
}
