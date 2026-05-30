export interface Villa {
  id: number;
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
  villaId: number;
  villaName: string;
  checkIn: string; // ISO date format
  checkOut: string; // ISO date format
  guests: number;
  rooms: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  expiresAt: string; // ISO string when hold expires
  createdAt: string;
}

export interface BookingResult {
  bookingCode: string;
  holdExpireAt: string;
  success: boolean;
  message?: string;
}

export interface BookingStatus {
  booking?: Booking;
  found: boolean;
  message?: string;
}

export interface Feedback {
  id: string;
  villaId: number;
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
