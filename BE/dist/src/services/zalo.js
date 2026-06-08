"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildZaloLinks = buildZaloLinks;
const settings_1 = require("./settings");
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
async function buildZaloLinks(params) {
    const phone = cleanPhone(await (0, settings_1.resolveZaloPhone)(params.phone));
    const message = [
        `Xin chào HenryTravel, tôi vừa đặt giữ chỗ villa ${params.villaName}.`,
        `Mã đặt phòng: ${params.bookingCode}`,
        params.guestName ? `Tên khách: ${params.guestName}` : null,
        `Số điện thoại: ${params.phone}`,
        `Ngày nhận phòng: ${formatDate(params.checkIn)}`,
        `Ngày trả phòng: ${formatDate(params.checkOut)}`,
        `Số khách: ${params.guestsCount}`,
        `Cơ cấu khách: ${params.adultCount ?? params.guestsCount} người lớn, ${params.childrenCount ?? 0} trẻ em 6-11 tuổi, ${params.infantCount ?? 0} trẻ em dưới 6 tuổi`,
        'Nhờ admin kiểm tra và xác nhận giúp tôi.',
    ].filter(Boolean).join('\n');
    const encodedMessage = encodeURIComponent(message);
    return {
        phone,
        message,
        mobile: `zalo://conversation?phone=${phone}`,
        web: `https://zalo.me/${phone}`,
        fallback: `https://zalo.me/${phone}?text=${encodedMessage}`,
    };
}
