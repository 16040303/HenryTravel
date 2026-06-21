# HenryTravel — Current System Plan

> Tài liệu này là tổng quan hệ thống hiện tại, không phải kế hoạch cũ. Đã đối chiếu với `BE/prisma/schema.prisma`, `BE/src/routes`, `FE/src/lib/api.ts`, và `FE/src/types/index.ts`.

---

## 1. Mục tiêu hệ thống

- Khách xem villa/homestay/khách sạn-resort, media, tiện ích, giá và chính sách.
- Khách đặt phòng dạng guest checkout, nhận mã booking và link Zalo fallback.
- Hệ thống giữ chỗ tạm thời bằng `pending_hold` để giảm overbooking.
- Admin quản lý villa, media, blocked dates, booking, feedback, settings, logs.
- FE hỗ trợ đa ngôn ngữ qua `FE/src/i18n`.
- Media ảnh/video lưu Cloudinary, metadata lưu trong `villa_media`.
- Backend dùng Express + Prisma/PostgreSQL.
- Frontend dùng Vite React + TypeScript.

---

## 2. User Flow

```txt
HomeView
  → chọn địa điểm/ngày/số khách/filter
ListingView
  → xem danh sách chỗ ở
DetailView
  → xem media, tiện ích, availability, feedback
Submit booking
  → tạo pending_hold + booking code + guest token + Zalo links
Booking lookup
  → tra cứu bằng mã booking + SĐT
Admin confirm/cancel/complete
  → cập nhật booking_history + admin_log
Sau check-out
  → khách có thể gửi feedback nếu đủ điều kiện
```

---

## 3. Admin Flow

```txt
Admin login
  → JWT + refresh token cookie
Dashboard
  → stats, recent bookings, recent feedbacks, top villas
Villa manager
  → CRUD, bulk actions, multilingual fields, price range, accommodation type
Media manager
  → upload Cloudinary, attach to villa, reorder, cover, delete
Availability manager
  → tạo/xóa villa_blocked_dates
Booking manager
  → filter, confirm, cancel, complete, history, CSV export
Feedback manager
  → xem/toggle verified
Settings
  → contact/social/common policy/hold settings
Logs
  → audit admin actions
```

---

## 4. Database Design hiện tại

### Core Tables

| Table | Mục đích |
|---|---|
| `users` | Admin/user/guest, password admin, guest token |
| `admin_refresh_tokens` | Refresh sessions cho admin |
| `villas` | Chỗ ở, đa ngôn ngữ một phần, loại villa/hotel_resort, giá |
| `villa_media` | Cloudinary image/video media |
| `villa_blocked_dates` | Khoảng ngày admin chặn thủ công |
| `bookings` | Booking lifecycle |
| `zalo_messages` | Zalo mobile/web/fallback links |
| `feedbacks` | Review đã xác thực theo booking |
| `admin_logs` | Audit thao tác admin |
| `booking_history` | Lịch sử trạng thái booking |
| `booking_attempts` | Rate limit booking |
| `system_settings` | Settings DB-first |
| `cloudinary_cleanup_jobs` | Cleanup media Cloudinary |

### Fields quan trọng

- `bookings.booking_code`: mã tra cứu.
- `bookings.guest_token`: token guest, không log/lộ không cần thiết.
- `bookings.hold_expire_at`: thời điểm hết hạn hold.
- `bookings.adult_count`, `children_count`, `infant_count`: breakdown số khách.
- `villas.accommodation_type`: `villa` hoặc `hotel_resort`.
- `villas.price_max`: giá tối đa nếu cần hiển thị range.
- `villa_media`: nguồn media chính, thay cho cách cũ lưu ảnh trong JSON field của villa.
- `villa_blocked_dates`: ngày chặn thủ công, phải tính vào availability/overlap.

---

## 5. Backend Plan / Current Modules

### Stack

- Node.js + Express
- TypeScript
- Prisma
- PostgreSQL
- Cloudinary
- SendGrid dependency/config present for email features

### Public API

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/villas` | Danh sách/filter chỗ ở |
| GET | `/api/villas/:id` | Chi tiết chỗ ở |
| GET | `/api/villas/:id/availability` | Calendar availability |
| GET | `/api/villas/:id/feedbacks` | Feedback verified |
| POST | `/api/bookings` | Tạo pending hold booking |
| GET | `/api/bookings/check` | Tra cứu booking |
| POST | `/api/feedbacks` | Gửi feedback |
| GET | `/api/settings/public` | Settings public-safe |

### Admin API

| Group | Mô tả |
|---|---|
| `/api/admin/auth` | Login, refresh, logout, change password |
| `/api/admin/villas` | CRUD + bulk actions + villa media routes |
| `/api/admin/media` | Upload media Cloudinary |
| `/api/admin/blocked-dates` | Chặn ngày thủ công |
| `/api/admin/bookings` | Booking list/actions/history/export |
| `/api/admin/feedbacks` | Feedback list/toggle |
| `/api/admin/settings` | Contact/social/policy/hold settings |
| `/api/admin/stats` | Dashboard stats |
| `/api/admin/logs` | Admin audit logs |

---

## 6. Frontend Plan / Current Modules

### Stack

- Vite React + TypeScript
- React Query integration via hooks
- FE types in `FE/src/types/index.ts`
- API client in `FE/src/lib/api.ts`
- i18n dictionaries in `FE/src/i18n`

### Public Views

| View | Mô tả |
|---|---|
| `HomeView` | Search/filter entry |
| `ListingView` | Danh sách chỗ ở |
| `DetailView` | Chi tiết, gallery, booking, feedback |
| `LookupView` | Tra cứu booking |
| `PolicyView` | Chính sách |

### Admin Views / Components

| Component | Mô tả |
|---|---|
| `AdminConsoleView` | Shell admin |
| `AdminDashboard` | Stats/dashboard |
| `AdminVillaManager` | CRUD villa |
| `MediaUploader` / `ImageUploader` | Upload/quản lý media |
| `AdminAvailabilityManager` | Blocked dates |
| `AdminBookingManager` | Booking operations/export/history |
| `AdminFeedbackManager` | Feedback moderation |
| `AdminSettings` | Settings/contact/policy/password |
| `AdminLayout` | Admin navigation/layout |

---

## 7. Media Plan hiện tại

```txt
Client/admin selects files
  → POST /api/admin/media/upload
  → BE validates + uploads to Cloudinary
  → returns uploaded media metadata
  → FE attaches media to villa via /api/admin/villas/:villaId/media
  → DB stores metadata in villa_media
  → delete/reorder/cover via villa media routes
  → cleanup records may be stored in cloudinary_cleanup_jobs
```

> Current system uses Cloudinary + `villa_media`. Do not use the legacy JSON image-field model for new work.

---

## 8. Booking / Availability Rules

- Booking create must validate date range and guest counts.
- Booking create must check overlap with active bookings.
- Booking create must include admin blocked dates in availability logic.
- Booking create is rate limited via `booking_attempts`.
- `pending_hold` expires via background job.
- Booking status changes must write `booking_history`.
- Admin booking actions must write `admin_logs`.

---

## 9. Feedback Rules

- Submit by booking code + phone in current FE API flow.
- Backend validates:
  - booking exists and matches phone,
  - booking is eligible by status,
  - checkout date has passed,
  - no duplicate feedback.
- Public feedback list only returns verified feedback.
- Admin can toggle verification/visibility.

---

## 10. Deployment / Production Status

Recommended deployment targets remain flexible:

| Thành phần | Hiện tại |
|---|---|
| Backend | Express app buildable with `npm run build` |
| Frontend | Vite app buildable with `npm run build` |
| Database | PostgreSQL via Prisma |
| Media | Cloudinary |
| Email | SendGrid config/dependency present; production delivery requires verification |

Requires verification:

- Backend production deploy.
- Frontend production deploy.
- Production DB migrations.
- Production Cloudinary credentials.
- Production email delivery.
- Production end-to-end flow.
- Full production security audit.

---

## 11. Current Implementation Checklist

### Completed / Verified in Code

- [x] Express API structure under `BE/src`.
- [x] Prisma schema under `BE/prisma/schema.prisma`.
- [x] Vite React FE under `FE/src`.
- [x] FE API client and mapping in `FE/src/lib/api.ts`.
- [x] FE i18n dictionaries in `FE/src/i18n`.
- [x] Admin auth with refresh token support.
- [x] Public booking, lookup, feedback, settings, villa APIs.
- [x] Admin villa, booking, feedback, logs, stats, settings APIs.
- [x] Admin blocked dates.
- [x] Cloudinary media upload and villa media management.
- [x] CSV export for admin bookings.
- [x] Background hold release job.
- [x] Cloudinary cleanup job.

### Requires Verification / Pending

- [ ] Production deploy state.
- [ ] Production email delivery.
- [ ] Full hardcoded-string i18n audit.
- [ ] Full security audit.
- [ ] Full responsive/device QA.
- [ ] Full production E2E workflow.
- [ ] Real payment gateway integration.

---

## 12. Kết luận

HenryTravel hiện là hệ thống Vite React + Express/Prisma/PostgreSQL, đã có các flow chính cho public booking và admin operations. Những phần đã có code nên được phát triển tiếp theo kiến trúc hiện tại: Cloudinary media qua `villa_media`, FE types tại `FE/src/types/index.ts`, API client tại `FE/src/lib/api.ts`, Prisma schema tại `BE/prisma/schema.prisma`, và admin routes dưới `/api/admin/*`.
