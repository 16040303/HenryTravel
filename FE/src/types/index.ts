export type EntityId = string | number;

export interface Villa {
  id: EntityId;
  name: string;
  location: string;
  image: string;
  images: string[];
  status: 'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance';
  rating: number;
  reviewsCount: number;
  price: number;
  type: 'Villa' | 'Homestay' | 'Căn hộ';
  facilities: string[];
  description: string;
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
  type?: 'Villa' | 'Homestay' | 'Căn hộ' | 'All';
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
  status: 'available' | 'pending' | 'booked';
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
    location: string;
    description?: string | null;
    status?: string;
    price: string | number;
    priceType?: string;
    facilities?: string[] | null;
    images?: string[] | null;
    maxGuests: number;
    holdMinutes?: number;
    avgRating?: number;
    bookingCount?: number;
    feedbackCount?: number;
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
