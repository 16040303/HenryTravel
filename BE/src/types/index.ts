import type { BookingStatus, PriceType, Prisma, VillaStatus } from '@prisma/client';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  items: T[];
}

export interface VillaListQuery {
  location?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
  page: number;
  limit: number;
}

export interface VillaWithStats {
  id: string;
  name: string;
  location: string;
  description: string | null;
  status: VillaStatus;
  price: Prisma.Decimal;
  priceType: PriceType;
  facilities: Prisma.JsonValue;
  images: Prisma.JsonValue;
  viewsCount: number;
  holdMinutes: number;
  depositRequired: boolean;
  depositAmount: Prisma.Decimal | null;
  maxGuests: number;
  createdAt: Date;
  avgRating: number;
  feedbackCount: number;
}

export type VillaAvailabilityStatus = 'available' | 'pending' | 'booked';

export interface BookingStatusSummary {
  status: BookingStatus;
  count: number;
}
