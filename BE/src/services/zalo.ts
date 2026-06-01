import { resolveZaloPhone } from './settings';

export interface ZaloLinkParams {
  phone: string;
  villaName: string;
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  guestName?: string;
  bookingCode: string;
}

export interface ZaloLinks {
  phone: string;
  message: string;
  mobile: string;
  web: string;
  fallback: string;
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export async function buildZaloLinks(params: ZaloLinkParams): Promise<ZaloLinks> {
  const phone = cleanPhone(await resolveZaloPhone(params.phone));
  const message = [
    `Xin chào HenryTravel, tôi vừa đặt giữ chỗ villa ${params.villaName}.`,
    `Mã đặt phòng: ${params.bookingCode}`,
    params.guestName ? `Tên khách: ${params.guestName}` : null,
    `Số điện thoại: ${params.phone}`,
    `Ngày nhận phòng: ${formatDate(params.checkIn)}`,
    `Ngày trả phòng: ${formatDate(params.checkOut)}`,
    `Số khách: ${params.guestsCount}`,
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
