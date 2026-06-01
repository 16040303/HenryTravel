import {
  Booking,
  BookingResult,
  BookingStatus,
  Feedback,
  FilterParams,
  SearchParams,
  Villa,
  VillaAvailabilityDay,
  VillaDetail,
  ZaloLinks,
} from '../types';
import { MOCK_VILLAS, MOCK_FEEDBACKS } from '../data/mockVillas';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiErrorBody {
  error?: string;
  message?: string;
}

interface BackendVilla {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  price: string | number;
  priceType?: string;
  maxGuests: number;
  images?: string[] | null;
  facilities?: string[] | null;
  status?: string;
  avgRating?: number;
  feedbackCount?: number;
  holdMinutes?: number;
}

interface BackendBooking {
  id: string;
  bookingCode: string;
  villaId?: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
  guestsCount?: number;
  roomsCount?: number;
  status: string;
  holdExpireAt?: string | null;
  createdAt?: string;
  villa?: BackendVilla;
  zaloLinks?: ZaloLinks;
  remainingMinutes?: number;
}

interface BackendFeedback {
  id: string;
  villaId: string;
  booking?: { guestName?: string | null };
  rating: number;
  comment?: string | null;
  createdAt: string;
  verified: boolean;
}

function normalizeDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function normalizeStatus(status?: string): Booking['status'] {
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED';
    case 'cancelled':
      return 'CANCELLED';
    case 'completed':
      return 'COMPLETED';
    default:
      return 'PENDING';
  }
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'All' || value === 'Tất cả địa điểm') return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const body = (data || {}) as ApiErrorBody;
    const error = new Error(body.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
    (error as Error & { code?: string }).code = body.error;
    throw error;
  }

  return data as T;
}

export function mapBackendVillaToFrontendVilla(villa: BackendVilla): VillaDetail {
  const images = Array.isArray(villa.images) && villa.images.length > 0
    ? villa.images
    : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200&auto=format&fit=crop'];
  const facilities = Array.isArray(villa.facilities) ? villa.facilities : [];

  return {
    id: villa.id,
    name: villa.name,
    location: villa.location,
    image: images[0],
    images,
    status: villa.status === 'available' ? 'Available' : villa.status === 'maintenance' ? 'Maintenance' : 'Hết phòng',
    rating: villa.avgRating || 0,
    reviewsCount: villa.feedbackCount || 0,
    price: Number(villa.price) || 0,
    type: 'Villa',
    facilities,
    description: villa.description || 'Villa cao cấp đang được cập nhật mô tả chi tiết.',
    isActive: villa.status !== 'hidden',
    avgRating: villa.avgRating || 0,
    feedbackCount: villa.feedbackCount || 0,
    guestsCount: villa.maxGuests || 1,
    bedroomsCount: Math.max(1, Math.ceil((villa.maxGuests || 2) / 2)),
    bathroomsCount: Math.max(1, Math.ceil((villa.maxGuests || 2) / 3)),
    address: villa.location,
    policies: {
      time: ['Nhận phòng sau 14:00', 'Trả phòng trước 12:00'],
      other: [`Giữ chỗ theo thời gian cấu hình của villa${villa.holdMinutes ? ` (${villa.holdMinutes} phút)` : ''}`, 'Vui lòng liên hệ Zalo để xác nhận thanh toán'],
    },
    bookedDates: [],
    pendingDates: [],
  };
}

export function mapBackendBookingToFrontendBooking(booking: BackendBooking, villa?: BackendVilla): Booking {
  const villaData = villa || booking.villa;
  const checkIn = normalizeDate(booking.checkIn);
  const checkOut = normalizeDate(booking.checkOut);
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
  const price = villaData ? Number(villaData.price) || 0 : 0;

  return {
    code: booking.bookingCode,
    bookingCode: booking.bookingCode,
    phone: booking.guestPhone || '',
    fullName: booking.guestName || '',
    email: booking.guestEmail || '',
    villaId: booking.villaId || villaData?.id || '',
    villaName: villaData?.name || 'VillaStay',
    checkIn,
    checkOut,
    guests: booking.guestsCount || 1,
    rooms: booking.roomsCount || 1,
    totalPrice: price * nights,
    status: normalizeStatus(booking.status),
    expiresAt: booking.holdExpireAt || '',
    holdExpireAt: booking.holdExpireAt || '',
    createdAt: booking.createdAt || new Date().toISOString(),
    zaloLinks: booking.zaloLinks,
    remainingMinutes: booking.remainingMinutes,
  };
}

export function mapBackendFeedbackToFrontendFeedback(feedback: BackendFeedback): Feedback {
  return {
    id: feedback.id,
    villaId: feedback.villaId,
    guestName: feedback.booking?.guestName || 'Khách VillaStay',
    rating: feedback.rating,
    comment: feedback.comment || '',
    createdAt: feedback.createdAt,
    isVerified: feedback.verified,
  };
}

export async function getVillas(
  filters?: Partial<SearchParams & FilterParams & { isFeatured?: boolean; page?: number; limit?: number }>
): Promise<Villa[]> {
  const query = buildQuery({
    location: filters?.location,
    checkIn: filters?.checkIn,
    checkOut: filters?.checkOut,
    guests: filters?.guests,
    minPrice: filters?.priceMin,
    maxPrice: filters?.priceMax,
    facilities: filters?.facilities,
    page: filters?.page,
    limit: filters?.limit || 50,
  });
  const response = await apiRequest<{ villas: BackendVilla[] }>(`/villas${query}`);
  return response.villas.map(mapBackendVillaToFrontendVilla);
}

export async function getVillaById(id: string): Promise<VillaDetail | undefined> {
  const villa = await apiRequest<BackendVilla>(`/villas/${encodeURIComponent(id)}`);
  const mapped = mapBackendVillaToFrontendVilla(villa);
  try {
    const availability = await getVillaAvailability(id, new Date().toISOString().slice(0, 7));
    mapped.bookedDates = availability.filter((item) => item.status === 'booked').map((item) => item.date);
    mapped.pendingDates = availability.filter((item) => item.status === 'pending').map((item) => item.date);
  } catch (error) {
    console.warn('Could not load villa availability', error);
  }
  return mapped;
}

export async function createBooking(data: {
  fullName: string;
  phone: string;
  email: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  specialRequest?: string;
}): Promise<BookingResult> {
  const response = await apiRequest<{
    booking: BackendBooking;
    guestToken?: string;
    zaloLinks?: ZaloLinks;
    holdMinutes?: number;
  }>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      villaId: data.villaId,
      guestName: data.fullName,
      guestPhone: data.phone.replace(/\s+/g, ''),
      guestEmail: data.email || undefined,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestsCount: data.guests,
      roomsCount: data.rooms,
      specialRequest: data.specialRequest,
    }),
  });

  return {
    success: true,
    bookingCode: response.booking.bookingCode,
    holdExpireAt: response.booking.holdExpireAt || '',
    booking: mapBackendBookingToFrontendBooking({ ...response.booking, zaloLinks: response.zaloLinks }),
    guestToken: response.guestToken,
    zaloLinks: response.zaloLinks,
    holdMinutes: response.holdMinutes,
  };
}

export async function checkBooking(code: string, phone: string): Promise<BookingStatus> {
  try {
    const response = await apiRequest<{
      booking: BackendBooking;
      villa: BackendVilla;
      remainingMinutes?: number;
      zaloLinks?: ZaloLinks;
    }>(`/bookings/check${buildQuery({ code: code.trim().toUpperCase(), phone: phone.replace(/\s+/g, '') })}`);

    return {
      found: true,
      booking: mapBackendBookingToFrontendBooking({
        ...response.booking,
        remainingMinutes: response.remainingMinutes,
        zaloLinks: response.zaloLinks,
      }, response.villa),
    };
  } catch (error) {
    const codeValue = (error as Error & { code?: string }).code;
    if (codeValue === 'BOOKING_NOT_FOUND') {
      return { found: false, message: error instanceof Error ? error.message : 'Không tìm thấy booking.' };
    }
    throw error;
  }
}

export async function getVillaAvailability(villaId: string, month: string): Promise<VillaAvailabilityDay[]> {
  const response = await apiRequest<{ availability: VillaAvailabilityDay[] }>(
    `/villas/${encodeURIComponent(villaId)}/availability${buildQuery({ month })}`
  );
  return response.availability;
}

export async function submitFeedback(data: {
  villaId?: string;
  guestName?: string;
  bookingCode?: string;
  phone?: string;
  rating: number;
  comment: string;
}): Promise<void> {
  if (!data.bookingCode || !data.phone) {
    throw new Error('Vui lòng tra cứu booking bằng mã và số điện thoại trước khi gửi đánh giá.');
  }
  await apiRequest('/feedbacks', {
    method: 'POST',
    body: JSON.stringify({
      bookingCode: data.bookingCode,
      phone: data.phone.replace(/\s+/g, ''),
      rating: data.rating,
      comment: data.comment,
    }),
  });
}

export async function getVillaFeedbacks(_villaId: string): Promise<Feedback[]> {
  // Public BE Phase 1 does not expose GET feedbacks by villa yet.
  // Keep an explicit empty response instead of silently reading stale mock data.
  return [];
}

// Admin remains mock/localStorage in this phase by design.
const STORAGE_KEYS = {
  VILLAS: 'villastay_villas',
  FEEDBACKS: 'villastay_feedbacks',
};

function getStoredVillas(): VillaDetail[] {
  const data = localStorage.getItem(STORAGE_KEYS.VILLAS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.VILLAS, JSON.stringify(MOCK_VILLAS));
    return MOCK_VILLAS as VillaDetail[];
  }
  return JSON.parse(data);
}

function saveStoredVillas(villas: VillaDetail[]) {
  localStorage.setItem(STORAGE_KEYS.VILLAS, JSON.stringify(villas));
}

export async function addVilla(v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>): Promise<VillaDetail> {
  const list = getStoredVillas();
  const newVilla: VillaDetail = {
    ...v,
    id: `mock-${Date.now()}`,
    rating: 5.0,
    reviewsCount: 1,
    images: [v.image, 'https://picsum.photos/800/600?random=10'],
    bookedDates: [],
    pendingDates: [],
  };
  list.push(newVilla);
  saveStoredVillas(list);
  return newVilla;
}

export async function confirmBookingAdmin(_code: string): Promise<boolean> {
  return false;
}

export function getStoredFeedbacksForAdmin(): Feedback[] {
  const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
  if (!data) return MOCK_FEEDBACKS as Feedback[];
  return JSON.parse(data);
}
