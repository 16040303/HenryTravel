import {
  AdminBookingHistoryResponse,
  AdminBookingResponse,
  AdminFeedbackResponse,
  AdminLogResponse,
  AdminLoginResponse,
  AdminStats,
  AdminUser,
  AdminVillaMutationPayload,
  AdminVillaResponse,
  Booking,
  BookingResult,
  BookingStatus,
  EntityId,
  Feedback,
  FilterParams,
  SearchParams,
  Villa,
  VillaAvailabilityDay,
  VillaDetail,
  ZaloLinks,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export interface PublicSettings {
  zaloPhone: string;
  zaloUrl: string;
}

interface BackendVilla {
  id: string;
  name: string;
  location?: string;
  description?: string | null;
  price?: string | number;
  priceType?: string;
  maxGuests?: number;
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
  bookingId?: string;
  guestName?: string | null;
  booking?: { guestName?: string | null; bookingCode?: string | null };
  rating: number;
  comment?: string | null;
  createdAt: string;
  verified: boolean;
}

export interface VillaFeedbackResponse {
  feedbacks: Feedback[];
  avgRating: number;
  total: number;
  page: number;
  totalPages: number;
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

export async function getPublicSettings(): Promise<PublicSettings> {
  return apiRequest<PublicSettings>('/settings/public');
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
    id: booking.id,
    code: booking.bookingCode,
    bookingCode: booking.bookingCode,
    phone: booking.guestPhone || '',
    fullName: booking.guestName || '',
    email: booking.guestEmail || '',
    villaId: booking.villaId || villaData?.id || '',
    villaName: villaData?.name || 'HenryTravel',
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
    guestName: feedback.guestName || feedback.booking?.guestName || 'Khách đã lưu trú',
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

export async function getVillaFeedbacks(villaId: EntityId, page = 1, limit = 10): Promise<VillaFeedbackResponse> {
  const response = await apiRequest<{
    feedbacks: BackendFeedback[];
    avgRating: number;
    total: number;
    page: number;
    totalPages: number;
  }>(`/villas/${encodeURIComponent(String(villaId))}/feedbacks${buildQuery({ page, limit })}`);

  return {
    feedbacks: response.feedbacks.map(mapBackendFeedbackToFrontendFeedback),
    avgRating: response.avgRating,
    total: response.total,
    page: response.page,
    totalPages: response.totalPages,
  };
}

export const ADMIN_TOKEN_KEY = 'henrytravel_admin_token';
export const ADMIN_USER_KEY = 'henrytravel_admin_user';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    adminLogout();
    return null;
  }
}

export function adminLogout(): void {
  clearAdminToken();
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem('HenryTravel_admin_authenticated');
  sessionStorage.removeItem('HenryTravel_admin_authenticated');
}

export async function adminApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const body = (data || {}) as ApiErrorBody;
    if (response.status === 401 || response.status === 403) {
      adminLogout();
    }
    const message = body.message || (response.status === 401 || response.status === 403
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : 'Không thể tải dữ liệu quản trị. Vui lòng thử lại.');
    const error = new Error(message);
    (error as Error & { code?: string; status?: number }).code = body.error;
    (error as Error & { code?: string; status?: number }).status = response.status;
    throw error;
  }

  return data as T;
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await apiRequest<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  setAdminToken(response.token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.user));
  return response;
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminApiRequest<AdminStats>('/admin/stats');
}

export async function getAdminVillas(params: {
  q?: string;
  location?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminVillaResponse> {
  return adminApiRequest<AdminVillaResponse>(`/admin/villas${buildQuery(params)}`);
}

export async function getAdminBookings(params: {
  villaId?: string;
  status?: string;
  phone?: string;
  code?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminBookingResponse> {
  return adminApiRequest<AdminBookingResponse>(`/admin/bookings${buildQuery(params)}`);
}

export async function getAdminFeedbacks(params: {
  villaId?: string;
  rating?: number;
  verified?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<AdminFeedbackResponse> {
  return adminApiRequest<AdminFeedbackResponse>(`/admin/feedbacks${buildQuery(params)}`);
}

export async function getAdminLogs(params: {
  adminId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminLogResponse> {
  return adminApiRequest<AdminLogResponse>(`/admin/logs${buildQuery(params)}`);
}

export function mapAdminVillaToFrontendVilla(villa: AdminVillaResponse['villas'][number]): VillaDetail {
  return mapBackendVillaToFrontendVilla(villa);
}

export function mapAdminBookingToFrontendBooking(booking: AdminBookingResponse['bookings'][number]): Booking {
  return mapBackendBookingToFrontendBooking(booking, booking.villa);
}

export function mapAdminFeedbackToFrontendFeedback(feedback: AdminFeedbackResponse['feedbacks'][number]): Feedback {
  return mapBackendFeedbackToFrontendFeedback(feedback);
}

export async function createAdminVilla(data: AdminVillaMutationPayload): Promise<AdminVillaResponse['villas'][number]> {
  return adminApiRequest<AdminVillaResponse['villas'][number]>('/admin/villas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminVilla(id: string, data: AdminVillaMutationPayload): Promise<AdminVillaResponse['villas'][number]> {
  return adminApiRequest<AdminVillaResponse['villas'][number]>(`/admin/villas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminVilla(id: string): Promise<void> {
  await adminApiRequest<void>(`/admin/villas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function confirmAdminBooking(id: string): Promise<AdminBookingResponse['bookings'][number]> {
  return adminApiRequest<AdminBookingResponse['bookings'][number]>(`/admin/bookings/${encodeURIComponent(id)}/confirm`, {
    method: 'PUT',
  });
}

export async function cancelAdminBooking(id: string, reason = 'Admin cancelled booking'): Promise<AdminBookingResponse['bookings'][number]> {
  return adminApiRequest<AdminBookingResponse['bookings'][number]>(`/admin/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function completeAdminBooking(id: string): Promise<AdminBookingResponse['bookings'][number]> {
  return adminApiRequest<AdminBookingResponse['bookings'][number]>(`/admin/bookings/${encodeURIComponent(id)}/complete`, {
    method: 'PUT',
  });
}

export async function getAdminBookingHistory(id: string): Promise<AdminBookingHistoryResponse> {
  return adminApiRequest<AdminBookingHistoryResponse>(`/admin/bookings/${encodeURIComponent(id)}/history`);
}

export async function toggleAdminFeedback(id: string): Promise<{ id: string; verified: boolean }> {
  return adminApiRequest<{ id: string; verified: boolean }>(`/admin/feedbacks/${encodeURIComponent(id)}/toggle`, {
    method: 'PUT',
  });
}

export interface AdminSettingsResponse {
  zaloPhone: string;
  zaloUrl: string;
}

export async function getAdminSettings(): Promise<AdminSettingsResponse> {
  return adminApiRequest<AdminSettingsResponse>('/admin/settings');
}

export async function updateAdminSettings(data: { zaloUrl?: string; zaloPhone?: string }): Promise<AdminSettingsResponse> {
  return adminApiRequest<AdminSettingsResponse>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

