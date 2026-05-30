import { Villa, VillaDetail, Booking, BookingResult, BookingStatus, Feedback, SearchParams, FilterParams } from '../types';
import { MOCK_VILLAS, MOCK_FEEDBACKS } from '../data/mockVillas';

// Helper to load/save state to Local Storage so tests and UI interactions carry state securely
const STORAGE_KEYS = {
  VILLAS: 'villastay_villas',
  BOOKINGS: 'villastay_bookings',
  FEEDBACKS: 'villastay_feedbacks'
};

function getStoredVillas(): VillaDetail[] {
  const data = localStorage.getItem(STORAGE_KEYS.VILLAS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.VILLAS, JSON.stringify(MOCK_VILLAS));
    return MOCK_VILLAS;
  }
  return JSON.parse(data);
}

function saveStoredVillas(villas: VillaDetail[]) {
  localStorage.setItem(STORAGE_KEYS.VILLAS, JSON.stringify(villas));
}

function getStoredBookings(): Booking[] {
  const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  if (!data) {
    // Seed initial searchable booking codes for interactive testing: PENDING, CONFIRMED, CANCELLED
    const seedBookings: Booking[] = [
      {
        code: 'VB-PENDING',
        phone: '0909123456',
        fullName: 'Nguyên Văn Khánh',
        email: 'khanh@example.com',
        villaId: 7,
        villaName: 'Pine Hill Retreat Villa',
        checkIn: '2026-05-28',
        checkOut: '2026-05-30',
        guests: 4,
        rooms: 1,
        totalPrice: 5000000,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins from now
        createdAt: new Date().toISOString()
      },
      {
        code: 'VB-CONFIRMED',
        phone: '0901234567',
        fullName: 'Trấn Thành',
        email: 'chenxing@example.com',
        villaId: 7,
        villaName: 'Pine Hill Retreat Villa',
        checkIn: '2026-06-15',
        checkOut: '2026-06-18',
        guests: 8,
        rooms: 4,
        totalPrice: 7500000,
        status: 'CONFIRMED',
        expiresAt: new Date(Date.now() + 150000 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        code: 'VB-CANCELLED',
        phone: '0933444555',
        fullName: 'Lê Kiều',
        email: 'lekieu@example.com',
        villaId: 1,
        villaName: 'Biệt thự Đồi Sứ Mộng Mơ',
        checkIn: '2026-04-10',
        checkOut: '2026-04-12',
        guests: 2,
        rooms: 1,
        totalPrice: 5000000,
        status: 'CANCELLED',
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(seedBookings));
    return seedBookings;
  }
  return JSON.parse(data);
}

function saveStoredBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

function getStoredFeedbacks(): Feedback[] {
  const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(MOCK_FEEDBACKS));
    return MOCK_FEEDBACKS;
  }
  return JSON.parse(data);
}

function saveStoredFeedbacks(feedbacks: Feedback[]) {
  localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
}

// Ensure local storage is initialized
getStoredVillas();
getStoredBookings();
getStoredFeedbacks();

export async function getVillas(
  filters?: Partial<SearchParams & FilterParams & { isFeatured?: boolean }>
): Promise<Villa[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));
  
  let list = getStoredVillas();

  if (filters) {
    if (filters.location && filters.location !== 'Tất cả địa điểm' && filters.location !== 'All') {
      list = list.filter((v) => v.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.type && filters.type !== 'All') {
      list = list.filter((v) => v.type === filters.type);
    }
    if (filters.priceMin !== undefined) {
      list = list.filter((v) => v.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      list = list.filter((v) => v.price <= filters.priceMax!);
    }
    if (filters.facilities && filters.facilities.length > 0) {
      list = list.filter((v) =>
        filters.facilities!.every((facId) => v.facilities.includes(facId))
      );
    }
  }

  return list;
}

export async function getVillaById(id: number): Promise<VillaDetail | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const list = getStoredVillas();
  return list.find((v) => v.id === id);
}

// Admins can add villas dynamically in our premium model!
export async function addVilla(v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>): Promise<VillaDetail> {
  const list = getStoredVillas();
  const newVilla: VillaDetail = {
    ...v,
    id: list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1,
    rating: 5.0,
    reviewsCount: 1,
    images: [v.image, 'https://picsum.photos/800/600?random=10'],
    bookedDates: [],
    pendingDates: []
  };
  list.push(newVilla);
  saveStoredVillas(list);
  return newVilla;
}

export async function createBooking(data: {
  fullName: string;
  phone: string;
  email: string;
  villaId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
}): Promise<BookingResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const villas = getStoredVillas();
  const villa = villas.find((v) => v.id === data.villaId);
  if (!villa) {
    return { success: false, message: 'Không tìm thấy thông tin Villa', bookingCode: '', holdExpireAt: '' };
  }

  const code = `VB-${Math.floor(100000 + Math.random() * 900000)}`;
  const holdExpireAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry time

  const bookings = getStoredBookings();
  const newBooking: Booking = {
    code,
    phone: data.phone.replace(/\s+/g, ''),
    fullName: data.fullName,
    email: data.email,
    villaId: data.villaId,
    villaName: villa.name,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guests: data.guests,
    rooms: data.rooms,
    totalPrice: data.totalPrice,
    status: 'PENDING',
    expiresAt: holdExpireAt,
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  saveStoredBookings(bookings);

  // Mark pending date on villa detail
  villa.pendingDates.push(data.checkIn);
  saveStoredVillas(villas);

  return {
    success: true,
    bookingCode: code,
    holdExpireAt
  };
}

export async function checkBooking(code: string, phone: string): Promise<BookingStatus> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const bookings = getStoredBookings();
  const cleanPhone = phone.replace(/\s+/g, '');
  const cleanCode = code.trim().toUpperCase();

  const found = bookings.find(
    (b) => b.code.toUpperCase() === cleanCode && b.phone.replace(/\s+/g, '') === cleanPhone
  );

  if (found) {
    return { found: true, booking: found };
  }

  return { found: false, message: 'Không tìm thấy thông tin đặt phòng với mã số và số điện thoại đã cung cấp.' };
}

export async function submitFeedback(data: {
  villaId: number;
  guestName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const feedbacks = getStoredFeedbacks();
  const newFeedback: Feedback = {
    id: `f-${Math.random().toString(36).substr(2, 9)}`,
    villaId: data.villaId,
    guestName: data.guestName,
    rating: data.rating,
    comment: data.comment,
    createdAt: new Date().toISOString(),
    isVerified: true
  };
  feedbacks.unshift(newFeedback);
  saveStoredFeedbacks(feedbacks);

  // Recalculate average rating of original villa
  const villas = getStoredVillas();
  const villa = villas.find((v) => v.id === data.villaId);
  if (villa) {
    const villaFeedbacks = feedbacks.filter((f) => f.villaId === data.villaId);
    const avgRating = villaFeedbacks.reduce((sum, current) => sum + current.rating, 0) / villaFeedbacks.length;
    villa.rating = parseFloat(avgRating.toFixed(1));
    villa.reviewsCount = villaFeedbacks.length;
    saveStoredVillas(villas);
  }
}

export async function getVillaFeedbacks(villaId: number): Promise<Feedback[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const feedbacks = getStoredFeedbacks();
  return feedbacks.filter((f) => f.villaId === villaId);
}

export async function confirmBookingAdmin(code: string): Promise<boolean> {
  const bookings = getStoredBookings();
  const found = bookings.find((b) => b.code === code);
  if (found) {
    found.status = 'CONFIRMED';
    saveStoredBookings(bookings);
    return true;
  }
  return false;
}
