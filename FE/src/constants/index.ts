export const LOCATIONS = ['Đà Lạt', 'Vũng Tàu', 'Phú Quốc', 'Hội An', 'Nha Trang', 'TP.HCM'];

export const FACILITIES = [
  { id: 'wifi', label: 'WiFi tốc độ cao', icon: 'Wifi' },
  { id: 'pool', label: 'Hồ bơi vô cực', icon: 'Waves' },
  { id: 'local_parking', label: 'Bãi đỗ xe', icon: 'ParkingCircle' },
  { id: 'kitchen', label: 'Bếp đầy đủ', icon: 'Utensils' },
  { id: 'outdoor_grill', label: 'Khu BBQ', icon: 'Flame' },
  { id: 'landscape', label: 'View núi', icon: 'Mountain' },
  { id: 'beach_access', label: 'View biển', icon: 'Compass' },
  { id: 'pets', label: 'Pet friendly', icon: 'PawPrint' },
];

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

