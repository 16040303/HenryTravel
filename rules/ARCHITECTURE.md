# 🏛️ ARCHITECTURE.md — Villa Booking System v2.0

> File này mô tả chi tiết kỹ thuật của toàn bộ hệ thống: DB schema đầy đủ, API contract, component interface, và các quyết định thiết kế quan trọng.
> **AI phải đọc file này trước khi viết bất kỳ code nào.**

---

## 1. Database Schema (Prisma)

```prisma
// packages/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  user
  admin
}

enum VillaStatus {
  available
  maintenance
  hidden
}

enum PriceType {
  fixed
  contact
}

enum BookingStatus {
  pending_hold
  confirmed
  cancelled
}

enum BookingSource {
  web
  admin_manual
}

enum DepositStatus {
  none
  pending
  paid
  refunded
}

model User {
  id          String    @id @default(uuid())
  name        String
  email       String    @unique
  phone       String?
  role        UserRole  @default(user)
  isGuest     Boolean   @default(false) @map("is_guest")
  guestToken  String?   @map("guest_token")
  createdAt   DateTime  @default(now()) @map("created_at")

  bookings    Booking[]
  adminLogs   AdminLog[]

  @@map("users")
}

model Villa {
  id              String      @id @default(uuid())
  name            String
  location        String
  description     String?
  status          VillaStatus @default(available)
  price           Decimal     @default(0)
  priceType       PriceType   @default(fixed) @map("price_type")
  facilities      Json        @default("[]")   // string[]
  images          Json        @default("[]")   // string[] — CDN URLs
  viewsCount      Int         @default(0) @map("views_count")
  holdMinutes     Int         @default(15) @map("hold_minutes")
  depositRequired Boolean     @default(false) @map("deposit_required")
  depositAmount   Decimal?    @map("deposit_amount")
  maxGuests       Int         @default(10) @map("max_guests")
  createdAt       DateTime    @default(now()) @map("created_at")

  bookings        Booking[]
  feedbacks       Feedback[]

  @@map("villas")
}

model Booking {
  id              String        @id @default(uuid())
  bookingCode     String        @unique @map("booking_code")  // VB-YYYY-NNN
  userId          String?       @map("user_id")
  villaId         String        @map("villa_id")
  guestName       String?       @map("guest_name")
  guestPhone      String?       @map("guest_phone")
  guestEmail      String?       @map("guest_email")
  guestToken      String?       @map("guest_token")  // UUID v4 — tra cứu không đăng nhập
  checkIn         DateTime      @map("check_in")
  checkOut        DateTime      @map("check_out")
  guestsCount     Int           @map("guests_count")
  roomsCount      Int           @default(1) @map("rooms_count")
  specialRequest  String?       @map("special_request")
  status          BookingStatus @default(pending_hold)
  source          BookingSource @default(web)
  holdExpireAt    DateTime?     @map("hold_expire_at")
  depositStatus   DepositStatus @default(none) @map("deposit_status")
  depositMethod   String?       @map("deposit_method")  // bank_transfer / momo / vnpay
  depositPaidAt   DateTime?     @map("deposit_paid_at")
  createdAt       DateTime      @default(now()) @map("created_at")

  user            User?         @relation(fields: [userId], references: [id])
  villa           Villa         @relation(fields: [villaId], references: [id])
  feedback        Feedback?
  zaloMessages    ZaloMessage[]
  history         BookingHistory[]

  @@index([villaId])
  @@index([userId])
  @@index([checkIn])
  @@index([status])
  @@index([bookingCode])
  @@map("bookings")
}

model ZaloMessage {
  id                String   @id @default(uuid())
  bookingId         String   @map("booking_id")
  messageUrlMobile  String   @map("message_url_mobile")   // zalo:// scheme
  messageUrlWeb     String   @map("message_url_web")      // zalo.me link
  messageUrlFallback String  @map("message_url_fallback") // zalo.me?text=encoded
  sentAt            DateTime @default(now()) @map("sent_at")

  booking           Booking  @relation(fields: [bookingId], references: [id])

  @@map("zalo_messages")
}

model Feedback {
  id        String   @id @default(uuid())
  bookingId String   @unique @map("booking_id")  // 1 booking = 1 feedback
  villaId   String   @map("villa_id")
  rating    Int                                   // 1-5
  comment   String?
  verified  Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  booking   Booking  @relation(fields: [bookingId], references: [id])
  villa     Villa    @relation(fields: [villaId], references: [id])

  @@index([villaId])
  @@map("feedbacks")
}

model AdminLog {
  id         String   @id @default(uuid())
  adminId    String   @map("admin_id")
  action     String                        // CREATE_VILLA / CONFIRM_BOOKING / etc.
  targetType String   @map("target_type")  // villa / booking / user / feedback
  targetId   String   @map("target_id")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  timestamp  DateTime @default(now())

  admin      User     @relation(fields: [adminId], references: [id])

  @@map("admin_logs")
}

model BookingHistory {
  id         String   @id @default(uuid())
  bookingId  String   @map("booking_id")
  status     String
  changedBy  String?  @map("changed_by")  // admin UUID hoặc 'system'
  note       String?
  timestamp  DateTime @default(now())

  booking    Booking  @relation(fields: [bookingId], references: [id])

  @@map("booking_history")
}

model BookingAttempt {
  id          String   @id @default(uuid())
  ipAddress   String   @map("ip_address")
  phone       String
  villaId     String   @map("villa_id")
  attemptedAt DateTime @default(now()) @map("attempted_at")

  @@index([ipAddress, attemptedAt])
  @@index([phone, attemptedAt])
  @@map("booking_attempts")
}
```

---

## 2. Shared Types (`packages/shared/types.ts`)

```typescript
// Tất cả type dùng chung giữa FE và BE

export type BookingStatus = 'pending_hold' | 'confirmed' | 'cancelled';
export type VillaStatus = 'available' | 'maintenance' | 'hidden';
export type PriceType = 'fixed' | 'contact';
export type DepositStatus = 'none' | 'pending' | 'paid' | 'refunded';

export interface Villa {
  id: string;
  name: string;
  location: string;
  description?: string;
  status: VillaStatus;
  price: number;
  priceType: PriceType;
  facilities: string[];
  images: string[];
  viewsCount: number;
  holdMinutes: number;
  depositRequired: boolean;
  depositAmount?: number;
  maxGuests: number;
  createdAt: string;
  // Aggregated
  avgRating?: number;
  feedbackCount?: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  villaId: string;
  villa?: Pick<Villa, 'id' | 'name' | 'location' | 'images'>;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  roomsCount: number;
  specialRequest?: string;
  status: BookingStatus;
  holdExpireAt?: string;
  depositStatus: DepositStatus;
  depositMethod?: string;
  createdAt: string;
}

export interface ZaloLinks {
  mobile: string;    // zalo://
  web: string;       // zalo.me
  fallback: string;  // zalo.me?text=
  phone: string;     // Hiển thị rõ ràng để copy
}

export interface Feedback {
  id: string;
  bookingId: string;
  villaId: string;
  rating: number;
  comment?: string;
  verified: boolean;
  createdAt: string;
}

// API Request/Response types
export interface CreateBookingRequest {
  villaId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkIn: string;       // ISO date string
  checkOut: string;
  guestsCount: number;
  roomsCount?: number;
  specialRequest?: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  guestToken: string;
  zaloLinks: ZaloLinks;
  holdMinutes: number;
}

export interface CheckBookingRequest {
  bookingCode: string;
  phone: string;
}

export interface CheckBookingResponse {
  booking: Booking;
  zaloLinks?: ZaloLinks;  // Chỉ trả nếu còn pending
  remainingMinutes?: number;
}

export interface SubmitFeedbackRequest {
  bookingId: string;
  rating: number;         // 1-5
  comment?: string;
}

export interface VillaAvailability {
  date: string;
  status: 'available' | 'pending' | 'booked';
}

export interface AdminStats {
  totalVillas: number;
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  pendingBookings: number;
  newFeedbacks: number;
}
```

---

## 3. API Contract

### 3.1 User Endpoints

#### `GET /villas`
```
Query params:
  location?:    string
  checkIn?:     string (ISO date)
  checkOut?:    string (ISO date)
  guests?:      number
  minPrice?:    number
  maxPrice?:    number
  facilities?:  string[] (comma-separated)
  page?:        number (default 1)
  limit?:       number (default 12)

Response 200:
  {
    villas: Villa[],
    total: number,
    page: number,
    totalPages: number
  }
```

#### `GET /villas/:id`
```
Response 200: Villa (với avgRating, feedbackCount)
Side effect: tăng views_count +1
```

#### `GET /villas/:id/availability`
```
Query params:
  month: string (YYYY-MM)

Response 200:
  {
    availability: VillaAvailability[]
  }
```

#### `GET /villas/:id/feedbacks`
```
Query params:
  page?: number

Response 200:
  {
    feedbacks: Feedback[],
    avgRating: number,
    total: number
  }
Note: Chỉ trả feedback với verified = true
```

#### `POST /bookings`
```
Headers: (none required — guest endpoint)
Body: CreateBookingRequest
Rate limit: 3 req/IP/15min, 2 req/phone/hour

Response 201: CreateBookingResponse
Response 409: { error: 'DATES_UNAVAILABLE' }
Response 429: { error: 'RATE_LIMITED', retryAfter: number }
Response 400: { error: 'VALIDATION_ERROR', details: string[] }
```

#### `GET /bookings/check`
```
Query params:
  code:  string (booking_code)
  phone: string

Response 200: CheckBookingResponse
Response 404: { error: 'BOOKING_NOT_FOUND' }
```

#### `POST /feedbacks`
```
Headers: guest_token cookie hoặc Authorization Bearer
Body: SubmitFeedbackRequest

Response 201: Feedback
Response 403: { error: 'BOOKING_NOT_CONFIRMED' | 'NOT_CHECKED_OUT' }
Response 409: { error: 'ALREADY_REVIEWED' }
```

---

### 3.2 Admin Endpoints

#### `POST /admin/auth/login`
```
Body: { email: string, password: string }
Response 200: { token: string, refreshToken: string, expiresIn: number }
Response 401: { error: 'INVALID_CREDENTIALS' }
```

#### `GET /admin/villas`
```
Headers: Authorization: Bearer <token> (required)
Response 200: { villas: (Villa & { bookingCount, feedbackCount })[] }
```

#### `POST /admin/villas`
```
Headers: Authorization: Bearer <token>
Body: Omit<Villa, 'id' | 'createdAt' | 'viewsCount'>
Response 201: Villa
Side effect: ghi admin_log
```

#### `PUT /admin/villas/:id`
```
Headers: Authorization: Bearer <token>
Body: Partial<Villa>
Response 200: Villa
Side effect: ghi admin_log
```

#### `DELETE /admin/villas/:id`
```
Headers: Authorization: Bearer <token>
Response 204
Side effect: ghi admin_log
Note: Chỉ xóa được nếu không có booking confirmed/pending
```

#### `POST /admin/upload`
```
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - files: File[] (max 20, mỗi file ≤ 5MB, type: jpeg/png/webp)
  - villaId: string

Response 200: { urls: string[] }
Response 400: { error: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'TOO_MANY_FILES' }
```

#### `GET /admin/bookings`
```
Headers: Authorization: Bearer <token>
Query params:
  villaId?, status?, checkIn?, checkOut?, phone?, page?, limit?
Response 200: { bookings: Booking[], total: number }
```

#### `PUT /admin/bookings/:id/confirm`
```
Headers: Authorization: Bearer <token>
Response 200: Booking
Side effect: ghi booking_history, ghi admin_log, gửi email admin + khách
```

#### `PUT /admin/bookings/:id/cancel`
```
Headers: Authorization: Bearer <token>
Body: { reason?: string }
Response 200: Booking
Side effect: ghi booking_history, ghi admin_log, gửi email khách
```

#### `GET /admin/bookings/export`
```
Headers: Authorization: Bearer <token>
Query params: villaId?, status?, from?, to?
Response 200: CSV file (Content-Type: text/csv)
```

#### `GET /admin/feedbacks`
```
Headers: Authorization: Bearer <token>
Query params: villaId?, page?
Response 200: { feedbacks: Feedback[], stats: { avgRating, distribution: Record<1|2|3|4|5, number> } }
```

#### `PUT /admin/feedbacks/:id/toggle`
```
Headers: Authorization: Bearer <token>
Response 200: { verified: boolean }
Side effect: ghi admin_log
```

#### `GET /admin/stats`
```
Headers: Authorization: Bearer <token>
Response 200: AdminStats
```

---

## 4. Component Interface

### `BookingForm`
```typescript
interface BookingFormProps {
  villaId: string;
  maxGuests: number;
  holdMinutes: number;
  depositRequired: boolean;
  depositAmount?: number;
  // Pre-fill từ Home filter
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
  // Các ngày không thể chọn
  unavailableDates: VillaAvailability[];
  onSuccess: (response: CreateBookingResponse) => void;
}
```

### `CalendarMini`
```typescript
interface CalendarMiniProps {
  villaId: string;
  month?: string;       // YYYY-MM, default: tháng hiện tại
  interactive?: boolean; // false = readonly display
  onDateSelect?: (date: string) => void;
}
```

### `ZaloLinkButton`
```typescript
interface ZaloLinkButtonProps {
  links: ZaloLinks;
  variant?: 'primary' | 'secondary';
  label?: string;
}
// Internal logic: detect mobile → dùng links.mobile với 2s timeout fallback
```

### `CountdownTimer`
```typescript
interface CountdownTimerProps {
  expireAt: string;     // ISO timestamp
  onExpire?: () => void; // Callback khi hết giờ
}
```

### `FeedbackList`
```typescript
interface FeedbackListProps {
  villaId: string;
  allowSubmit?: boolean;  // true nếu user đã check-out từ villa này
  bookingId?: string;     // Cần thiết để submit feedback
}
```

### `AdminTable`
```typescript
interface AdminTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
  }[];
  loading?: boolean;
  onRowAction?: (action: string, row: T) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}
```

### `ImageUploader`
```typescript
interface ImageUploaderProps {
  villaId: string;
  existingImages?: string[];    // Hiện tại
  maxImages?: number;           // Default 20
  onUploadComplete: (urls: string[]) => void;
}
// Internal: client resize trước khi upload
```

---

## 5. Background Job — Release Hold

```typescript
// apps/api/src/jobs/releaseHold.ts
// Chạy mỗi 1 phút bằng node-cron hoặc setInterval

async function releaseExpiredHolds() {
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: 'pending_hold',
      holdExpireAt: { lt: new Date() }
    },
    select: { id: true, villaId: true }
  });

  for (const booking of expiredBookings) {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' }
      }),
      prisma.bookingHistory.create({
        data: {
          bookingId: booking.id,
          status: 'cancelled',
          changedBy: 'system',
          note: 'Auto-released: hold time expired'
        }
      })
    ]);
  }
}
```

---

## 6. Zalo Link Builder

```typescript
// apps/api/src/services/zalo.ts

interface ZaloLinkParams {
  phone: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  bookingCode: string;
}

export function buildZaloLinks(params: ZaloLinkParams): ZaloLinks {
  const message = `Xin chào! Tôi vừa đặt phòng tại ${params.villaName}.\n`
    + `Mã booking: ${params.bookingCode}\n`
    + `Check-in: ${params.checkIn} | Check-out: ${params.checkOut}\n`
    + `Số khách: ${params.guestsCount}\n`
    + `Vui lòng xác nhận giúp tôi. Xin cảm ơn!`;
  
  const encoded = encodeURIComponent(message);
  const cleanPhone = params.phone.replace(/[^0-9]/g, '');

  return {
    mobile:   `zalo://conversation?phone=${cleanPhone}`,
    web:      `https://zalo.me/${cleanPhone}`,
    fallback: `https://zalo.me/${cleanPhone}?text=${encoded}`,
    phone:    params.phone
  };
}
```

---

## 7. Feedback Validation Service

```typescript
// apps/api/src/services/feedback.ts

export async function validateAndSubmitFeedback(
  bookingId: string,
  rating: number,
  comment?: string
): Promise<Feedback> {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

  // Kiểm tra theo thứ tự — không được thay đổi
  if (booking.status !== 'confirmed') {
    throw new AppError(403, 'BOOKING_NOT_CONFIRMED', 'Booking chưa được xác nhận');
  }
  if (new Date(booking.checkOut) > new Date()) {
    throw new AppError(403, 'NOT_CHECKED_OUT', 'Chưa đến ngày check-out');
  }
  const existing = await prisma.feedback.findUnique({ where: { bookingId } });
  if (existing) {
    throw new AppError(409, 'ALREADY_REVIEWED', 'Đã đánh giá booking này rồi');
  }

  return prisma.feedback.create({
    data: { bookingId, villaId: booking.villaId, rating, comment, verified: true }
  });
}
```

---

## 8. Rate Limiting Logic

```typescript
// apps/api/src/middleware/rateLimit.ts

// Giới hạn:
// - Max 3 lần booking / IP / 15 phút
// - Max 2 lần booking / SĐT / 1 giờ

export async function bookingRateLimit(req, res, next) {
  const ip = req.ip;
  const phone = req.body?.guestPhone;
  const now = new Date();

  // Check IP
  const ipCount = await prisma.bookingAttempt.count({
    where: {
      ipAddress: ip,
      attemptedAt: { gt: new Date(now.getTime() - 15 * 60 * 1000) }
    }
  });
  if (ipCount >= 3) return res.status(429).json({ error: 'RATE_LIMITED', retryAfter: 15 });

  // Check phone
  if (phone) {
    const phoneCount = await prisma.bookingAttempt.count({
      where: {
        phone,
        attemptedAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) }
      }
    });
    if (phoneCount >= 2) return res.status(429).json({ error: 'RATE_LIMITED', retryAfter: 60 });
  }

  // Log attempt
  await prisma.bookingAttempt.create({
    data: { ipAddress: ip, phone: phone || '', villaId: req.body?.villaId || '' }
  });

  next();
}
```

---

## 9. Admin Log Helper

```typescript
// Gọi sau mọi thao tác CRUD của admin
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: 'villa' | 'booking' | 'user' | 'feedback',
  targetId: string,
  req: Request
) {
  await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });
}
```

---

> Cập nhật file này khi có thay đổi kiến trúc đã được approve. Không tự ý sửa mà không thông báo cho team.
