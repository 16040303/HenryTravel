# 🏡 Villa Booking System — v2.0

Hệ thống đặt phòng villa/homestay với UX kiểu Agoda/Booking.com, tích hợp Zalo, guest checkout, hold booking chống overbooking, và feedback có kiểm soát.

---

## 📌 Mục tiêu

- Khách xem villa, hình ảnh, tiện ích, giá → đặt lịch qua **Zalo** với link pre-fill
- Hệ thống **hold booking tạm thời** (configurable per villa) → chống overbooking
- **Guest checkout** — không bắt đăng ký, tra cứu bằng mã booking + SĐT
- Admin quản lý villa, booking, feedback, thống kê qua dashboard
- **Feedback verified** — chỉ khách đã check-out mới được đánh giá → chống fake

---

## 🏗️ Tech Stack

| Layer | Công nghệ | Dự phòng |
|-------|-----------|----------|
| Frontend | Next.js (React) | — |
| Backend | Node.js + Express | — |
| Database | Supabase (PostgreSQL) | Railway / Render |
| ORM | Prisma | Sequelize |
| Storage ảnh | Supabase Storage | AWS S3 |
| Email | SendGrid | Nodemailer + Gmail SMTP |
| CDN | Supabase CDN | Cloudflare |
| Deploy BE | Render | Railway |
| Deploy FE | Vercel | Netlify |

---

## 📂 Cấu trúc Codebase

```
villa-booking/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/
│   │   │   ├── (user)/
│   │   │   │   ├── page.tsx                  # Home — search widget
│   │   │   │   ├── villas/
│   │   │   │   │   ├── page.tsx              # Danh sách villa
│   │   │   │   │   └── [id]/page.tsx         # Chi tiết villa
│   │   │   │   ├── booking/
│   │   │   │   │   ├── success/page.tsx      # Booking success + countdown
│   │   │   │   │   └── check/page.tsx        # Tra cứu booking
│   │   │   └── admin/
│   │   │       ├── page.tsx                  # Dashboard
│   │   │       ├── villas/page.tsx           # Quản lý villa
│   │   │       ├── bookings/page.tsx         # Quản lý booking
│   │   │       ├── feedbacks/page.tsx        # Quản lý feedback
│   │   │       └── logs/page.tsx             # Admin logs
│   │   ├── components/
│   │   │   ├── VillaCard.tsx
│   │   │   ├── VillaDetail.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── ZaloLinkButton.tsx
│   │   │   ├── CalendarMini.tsx
│   │   │   ├── FeedbackList.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── BookingStatusBadge.tsx
│   │   │   ├── AdminTable.tsx
│   │   │   ├── StatsChart.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── AlertBanner.tsx
│   │   └── lib/
│   │       ├── api.ts              # API client
│   │       └── zalo.ts            # Zalo link builder (client)
│   │
│   └── api/                        # Node.js + Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── villas.ts
│       │   │   ├── bookings.ts
│       │   │   ├── feedbacks.ts
│       │   │   └── admin/
│       │   │       ├── auth.ts
│       │   │       ├── villas.ts
│       │   │       ├── bookings.ts
│       │   │       ├── feedbacks.ts
│       │   │       ├── upload.ts
│       │   │       └── logs.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts         # JWT + guest_token middleware
│       │   │   └── rateLimit.ts    # Per IP + per phone
│       │   ├── jobs/
│       │   │   └── releaseHold.ts  # Background job mỗi 1 phút
│       │   ├── services/
│       │   │   ├── zalo.ts         # Zalo link builder (server)
│       │   │   ├── email.ts        # SendGrid / nodemailer
│       │   │   ├── upload.ts       # S3 / Supabase Storage
│       │   │   └── feedback.ts     # Validate + insert feedback
│       │   └── lib/
│       │       └── prisma.ts       # Prisma client singleton
│       └── prisma/
│           └── schema.prisma       # DB schema đầy đủ
│
├── packages/
│   └── shared/                     # Types dùng chung FE + BE
│       └── types.ts
│
└── .cursorrules                    # ← AI coding rules (BẮT BUỘC đọc)
```

---

## 🗄️ Database — Sơ đồ quan hệ

```
users ──────────────── bookings ──────────────── villas
  │                      │  │                      │
  │              booking_history              feedbacks
  │                      │                         │
  │               zalo_messages              (villa_id FK)
  │
  └── admin_logs (admin_id FK)

booking_attempts (rate limiting — standalone)
```

### Bảng chính

| Bảng | Vai trò |
|------|---------|
| `users` | Admin + registered users + guest record |
| `villas` | Villa/homestay với hold_minutes, giá, tiện ích |
| `bookings` | Booking với trạng thái pending_hold/confirmed/cancelled |
| `feedbacks` | Review của khách đã check-out (verified only) |
| `zalo_messages` | Lưu 3 dạng link Zalo cho mỗi booking |
| `booking_history` | Lịch sử thay đổi trạng thái booking |
| `booking_attempts` | Rate limiting per IP + per phone |
| `admin_logs` | Audit log mọi thao tác admin |

---

## 🔐 Auth Strategy

```
Admin  → JWT (Bearer token) — expire 8h + refresh token
User   → JWT (tùy chọn — nếu tạo tài khoản)
Guest  → guest_token (UUID v4) — lưu trong cookie + trả về khi booking
```

Tra cứu booking (guest): dùng `booking_code` + `phone` — **không cần đăng nhập**.

---

## 📱 Zalo Link — 3 lớp

```
1. Mobile deep link:  zalo://conversation?phone=...
2. Web fallback:      https://zalo.me/{phone}
3. Full fallback:     https://zalo.me/{phone}?text={encoded_message}
```

Logic xử lý: Mobile thử deep link → timeout 2s → fallback zalo.me. Desktop mở thẳng zalo.me.  
Luôn hiển thị SĐT rõ ràng để khách copy thủ công nếu cần.

---

## ⏱️ Hold Booking — Chống Overbooking

- Khi khách submit form → booking tạo với `status = 'pending_hold'`
- `hold_expire_at = NOW() + villa.hold_minutes` (mặc định 15 phút nếu không set)
- Background job chạy mỗi **1 phút**: scan pending_hold hết hạn → set `cancelled` → ghi `booking_history`
- Phòng trở lại available ngay sau khi auto-release

---

## ✅ Feedback — Điều kiện submit

1. `booking.status = 'confirmed'`
2. `booking.check_out < NOW()` (đã check-out)
3. Chưa tồn tại feedback cho `booking_id` này

Feedback chỉ hiển thị khi `verified = true`.

---

## 📤 Image Upload Flow

```
Client resize (canvas API, max 1920px, quality 85%)
  → POST /admin/upload (multipart/form-data)
  → Backend validate: type ∈ [jpeg/png/webp], size ≤ 5MB, max 20 ảnh/villa
  → Upload → Supabase Storage / AWS S3
  → Trả public CDN URL → lưu vào villas.images (JSONB array)
```

---

## 🚀 Quick Start

```bash
# Clone và cài dependencies
git clone <repo>
cd villa-booking
pnpm install

# Setup env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Chạy migration DB
cd apps/api && npx prisma migrate dev

# Start dev
pnpm dev
```

### Biến môi trường cần thiết

```env
# apps/api/.env
DATABASE_URL=
JWT_SECRET=
SENDGRID_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ZALO_PHONE=

# apps/web/.env.local
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ZALO_PHONE=
```

---

## 📧 Notification Events

| Sự kiện | Nhận | Kênh |
|---------|------|------|
| Booking pending mới | Admin | Email + In-app alert |
| Booking confirmed | Admin + Khách | Email |
| Booking cancelled (auto/manual) | Khách | Email |
| Feedback mới | Admin | Email |

---

## 🛡️ Bảo mật checklist

- JWT + refresh token, expire 8h
- guest_token UUID v4 — không đoán được
- Rate limiting: per IP + per SĐT trên `POST /bookings`
- Input validation: check-in < check-out, guests ≤ max_guests, email/phone format
- Prisma ORM — tránh SQL injection
- File upload validation trước khi lên storage
- Admin IP log — ghi lại mọi thao tác
- CORS chỉ cho phép domain frontend

---

> **Quan trọng:** Trước khi code bất kỳ feature nào, đọc `.cursorrules` để đảm bảo tuân thủ kiến trúc dự án.
