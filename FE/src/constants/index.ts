export const DEFAULT_LOCATIONS = ['Đà Nẵng', 'Huế', 'Hội An'] as const;

export const TRAVEL_DESTINATIONS = [
  'Đà Nẵng',
  'Huế',
  'Hội An',
  'Nha Trang',
  'Đà Lạt',
  'Phú Quốc',
  'Hạ Long',
  'Sapa',
  'Vũng Tàu',
  'Quy Nhơn',
  'Mũi Né',
  'Hà Nội',
  'TP. Hồ Chí Minh',
] as const;

export function normalizeLocationCity(location: string): string {
  const value = location.trim();
  const knownCities = TRAVEL_DESTINATIONS;
  const matchedCity = knownCities.find(city => value.toLowerCase().includes(city.toLowerCase()));
  return matchedCity || value.split(',').map(part => part.trim()).filter(Boolean).pop() || value;
}

export { FACILITIES, FILTER_FACILITIES } from '../data/amenities';

export const BOOKING_STATUSES = {
  PENDING: {
    label: 'Đang giữ chỗ',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeClass: 'bg-[#ffdbd0] text-[#390c00]',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    colorClass: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

/** Public fallback values are build-time data and must never contain secrets. */
function normalizeFallbackPhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const phone = value.trim().replace(/[^0-9]/g, '');
  return phone.length >= 8 && phone.length <= 15 ? phone : '';
}

function normalizeFallbackUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeFallbackWhatsAppUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const input = value.trim();
  if (!input) return '';

  const phone = input.replace(/[^0-9]/g, '');
  if (/^[+\d\s().-]+$/.test(input) && phone.length >= 8 && phone.length <= 15) {
    return `https://wa.me/${phone}`;
  }

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    const isAllowedHost = host === 'wa.me'
      || host === 'api.whatsapp.com'
      || host === 'web.whatsapp.com'
      || host.endsWith('.whatsapp.com');
    return url.protocol === 'https:' && isAllowedHost ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeFallbackText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const ZALO_PHONE_FALLBACK = normalizeFallbackPhone(import.meta.env.VITE_ZALO_PHONE);

export function getZaloLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return '';
  const encodedText = message ? encodeURIComponent(message) : '';
  return `https://zalo.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}

export const PUBLIC_SETTINGS_FALLBACK = {
  zaloPhone: ZALO_PHONE_FALLBACK,
  zaloUrl: ZALO_PHONE_FALLBACK ? getZaloLink(ZALO_PHONE_FALLBACK) : '',
  whatsappUrl: normalizeFallbackWhatsAppUrl(import.meta.env.VITE_WHATSAPP_URL),
  wechatId: normalizeFallbackText(import.meta.env.VITE_WECHAT_ID),
  kakaoTalkId: normalizeFallbackText(import.meta.env.VITE_KAKAOTALK_ID),
  tikTokUrl: normalizeFallbackUrl(import.meta.env.VITE_TIKTOK_URL),
  facebookPersonalUrl: normalizeFallbackUrl(import.meta.env.VITE_FACEBOOK_PERSONAL_URL),
  facebookFanpageUrl: normalizeFallbackUrl(import.meta.env.VITE_FACEBOOK_FANPAGE_URL),
  naverBlogUrl: normalizeFallbackUrl(import.meta.env.VITE_NAVER_BLOG_URL),
  instagramWorkUrl: normalizeFallbackUrl(import.meta.env.VITE_INSTAGRAM_WORK_URL),
  commonPolicy: normalizeFallbackText(import.meta.env.VITE_COMMON_POLICY),
} as const;
