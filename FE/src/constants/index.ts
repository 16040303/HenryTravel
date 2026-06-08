export const DEFAULT_LOCATIONS = ['Đà Nẵng', 'Huế', 'Hội An'];

export function normalizeLocationCity(location: string): string {
  const value = location.trim();
  const knownCities = [...DEFAULT_LOCATIONS, 'Đà Lạt', 'Vũng Tàu', 'Phú Quốc', 'Nha Trang', 'TP.HCM'];
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

/** Fallback Zalo phone from env — used only when API is unavailable */
export const ZALO_PHONE_FALLBACK = (import.meta.env.VITE_ZALO_PHONE as string) || '';

export function getZaloLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return '';
  const encodedText = message ? encodeURIComponent(message) : '';
  return `https://zalo.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}

