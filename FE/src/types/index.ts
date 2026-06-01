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
