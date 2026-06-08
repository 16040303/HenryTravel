export type EntityId = string | number;
export type AccommodationTypeValue = 'villa' | 'hotel_resort';
export type AccommodationTypeLabel = 'Villa' | 'Khách sạn - resort';
export type MediaType = 'image' | 'video';

export interface VillaMedia {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  sortOrder: number;
  isCover: boolean;
}

export interface Villa {
  id: EntityId;
  name: string;
  nameEn?: string | null;
  location: string;
  locationEn?: string | null;
  image: string;
  status: 'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance';
  rating: number;
  reviewsCount: number;
  price: number;
  priceMax?: number | null;
  type: AccommodationTypeLabel;
  facilities: string[];
  description: string;
  descriptionEn?: string | null;
  descriptionKo?: string | null;
  isActive?: boolean;
  avgRating?: number;
  feedbackCount?: number;
}

export interface VillaDetail extends Villa {
  guestsCount: number;
  bedroomsCount: number;
  bathroomsCount: number;
  address: string;
  mapUrl?: string;
  policies: {
    time: string[];
    other: string[];
  };
  bookedDates: string[]; // ISO Date strings, e.g., '2024-12-20'
  pendingDates: string[]; // ISO Date strings, e.g., '2024-12-25'
  blockedDates: string[]; // ISO Date strings blocked manually by admin
  media: VillaMedia[];
}

export interface Booking {
  id?: EntityId;
  code: string;
  phone: string;
  fullName: string;
  email: string;
  villaId: EntityId;
  villaName: string;
  checkIn: string; // ISO date format
  checkOut: string; // ISO date format
  guests: number;
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  rooms: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  expiresAt: string; // ISO string when hold expires
  createdAt: string;
  bookingCode?: string;
  holdExpireAt?: string;
  guestToken?: string;
  zaloLinks?: ZaloLinks;
  remainingMinutes?: number;
}

export interface BookingResult {
  bookingCode: string;
  holdExpireAt: string;
  success: boolean;
  message?: string;
  booking?: Booking;
  guestToken?: string;
  zaloLinks?: ZaloLinks;
  holdMinutes?: number;
}

export interface BookingStatus {
  booking?: Booking;
  found: boolean;
  message?: string;
}

export interface Feedback {
  id: EntityId;
  villaId: EntityId;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

export interface SearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface FilterParams {
  priceMin: number;
  priceMax: number;
  type?: AccommodationTypeValue | 'All';
  facilities: string[];
}

export interface ZaloLinkInfo {
  phone: string;
  formattedLink: string;
  label: string;
}

export interface ZaloLinks {
  mobile: string;
  web: string;
  fallback: string;
  phone?: string;
  message?: string;
}

export interface VillaAvailabilityDay {
  date: string;
  status: 'available' | 'pending' | 'booked' | 'blocked';
  reason?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | string;
}

export interface AdminLoginResponse {
  token: string;
  expiresIn: string;
  user: AdminUser;
}

export interface AdminStats {
  totalVillas: number;
  activeVillas: number;
  bookingsThisWeek?: number;
  bookingsThisMonth?: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  newFeedbacks?: number;
  estimatedRevenue: number;
  topVillas: Array<{ id: string; name: string; location?: string; bookingCount: number }>;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    villaId: string;
    guestName?: string | null;
    guestPhone?: string | null;
    guestEmail?: string | null;
    checkIn: string;
    checkOut: string;
    guestsCount?: number;
    adultCount?: number;
    childrenCount?: number;
    infantCount?: number;
    roomsCount?: number;
    status: string;
    holdExpireAt?: string | null;
    createdAt?: string;
    villa?: { id: string; name: string; location?: string; price?: string | number };
  }>;
  recentFeedbacks: Array<{
    id: string;
    villaId: string;
    bookingId?: string;
    rating: number;
    comment?: string | null;
    verified: boolean;
    createdAt: string;
    villa?: { id: string; name: string; location?: string };
    booking?: { id?: string; bookingCode?: string; guestName?: string | null; guestPhone?: string | null };
  }>;
}

export interface AdminVillaResponse {
  villas: Array<{
    id: string;
    name: string;
    nameEn?: string | null;
    location: string;
    locationEn?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    descriptionKo?: string | null;
    status?: string;
    price: string | number;
    priceMax?: string | number | null;
    priceType?: string;
    facilities?: string[] | null;
    mediaCover?: VillaMedia | null;
    maxGuests: number;
    avgRating?: number;
    bookingCount?: number;
    feedbackCount?: number;
    accommodationType?: AccommodationTypeValue;
    createdAt?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminBookingResponse {
  bookings: AdminStats['recentBookings'];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminFeedbackResponse {
  feedbacks: AdminStats['recentFeedbacks'];
  stats?: { avgRating: number; distribution: Record<string, number> };
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminLogResponse {
  logs: Array<{
    id: string;
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    timestamp: string;
    admin?: { id: string; name: string; email: string };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminBlockedDate {
  id: string;
  villaId: string;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string | null;
  createdBy: string;
  createdAt: string;
  villa?: { id: string; name: string; location: string };
  admin?: { id: string; name: string; email: string };
}

export interface AdminBlockedDateResponse {
  blockedDates: AdminBlockedDate[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminBlockedDatePayload {
  villaId: string;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string;
}

export interface AdminVillaMutationPayload {
  name?: string;
  nameEn?: string | null;
  location?: string;
  locationEn?: string | null;
  description?: string;
  descriptionEn?: string | null;
  descriptionKo?: string | null;
  price?: number;
  priceMax?: number | null;
  priceType?: 'fixed' | 'contact';
  status?: 'available' | 'maintenance' | 'hidden';
  maxGuests?: number;
  facilities?: string[];
  depositRequired?: boolean;
  depositAmount?: number | null;
  accommodationType?: AccommodationTypeValue;
}

export interface AdminBookingHistoryResponse {
  history: Array<{
    id: string;
    bookingId: string;
    status: string;
    changedBy?: string | null;
    note?: string | null;
    timestamp: string;
  }>;
}
