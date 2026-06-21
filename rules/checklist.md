# ✅ Checklist Triển Khai — HenryTravel hiện tại

> Checklist này phản ánh trạng thái đã đối chiếu với code hiện tại. Các mục production/deploy/security audit thực tế để `requires verification` nếu chưa có bằng chứng chạy production.

---

## Phase 1 — Core Booking/Public

### 🗄️ Database

- [x] Prisma schema tại `BE/prisma/schema.prisma`
- [x] Bảng core: `users`, `villas`, `bookings`, `zalo_messages`, `feedbacks`, `admin_logs`, `booking_history`, `booking_attempts`, `system_settings`
- [x] Bảng mở rộng hiện tại: `admin_refresh_tokens`, `villa_blocked_dates`, `villa_media`, `cloudinary_cleanup_jobs`
- [x] Enum hiện tại: `UserRole`, `VillaStatus`, `PriceType`, `BookingStatus`, `BookingSource`, `DepositStatus`, `MediaType`, `AccommodationType`
- [x] Villa hỗ trợ đa ngôn ngữ một phần: `nameEn`, `locationEn`, `descriptionEn`, `descriptionKo`
- [x] Booking có breakdown khách: `adultCount`, `childrenCount`, `infantCount`

### 🔐 Auth

- [x] Admin JWT Bearer middleware
- [x] Admin refresh token flow qua cookie/http session route
- [x] Admin logout
- [x] Admin change password
- [x] `guest_token` tạo khi booking và lưu cookie
- [x] Admin routes gắn `adminAuthMiddleware`

### 🏠 Public Backend

- [x] `GET /api/health`
- [x] `GET /api/villas`
- [x] `GET /api/villas/:id`
- [x] `GET /api/villas/:id/availability`
- [x] `GET /api/villas/:id/feedbacks`
- [x] `POST /api/bookings`
- [x] `GET /api/bookings/check`
- [x] `POST /api/feedbacks`
- [x] `GET /api/settings/public`
- [x] Booking rate limit qua `booking_attempts`
- [x] Booking overlap validation gồm confirmed/pending và blocked dates

### ⚙️ Background Jobs

- [x] Release expired `pending_hold` bookings
- [x] Ghi `booking_history` khi auto-cancel hold
- [x] Cloudinary cleanup job cho media bị xóa/orphan
- [x] Job lỗi không làm crash server

### 📱 Zalo / Contact Settings

- [x] Build đủ Zalo links: `zalo://`, `zalo.me`, fallback text
- [x] Lưu Zalo links vào `zalo_messages`
- [x] Settings đọc DB-first, env fallback
- [x] Public settings trả Zalo, WhatsApp, social links, common policy

### 🖥️ Frontend Public

- [x] FE stack: Vite React + TypeScript
- [x] API client: `FE/src/lib/api.ts`
- [x] FE types: `FE/src/types/index.ts`
- [x] FE i18n dictionaries: `FE/src/i18n`
- [x] Home view: search dates/guest/location/filter
- [x] Listing view: cards/filter/list
- [x] Detail view: media gallery, availability, booking, feedback
- [x] Booking lookup view
- [x] Policy view
- [x] Scroll behavior helpers

### 🧩 Public Components

- [x] Villa/listing card behavior in `ListingView`
- [x] Booking form behavior in `DetailView`
- [x] Zalo/contact fallback behavior in FE API/constants/components
- [x] Countdown via `useBookingCountdown`
- [x] Booking status UI in admin/public booking displays
- [x] Feedback display and rating UI
- [x] Custom date picker and guest category picker
- [x] Optimized image/lightbox components

---

## Phase 2 — Admin & Operations

### 🔑 Admin Auth UI/API

- [x] `POST /api/admin/auth/login`
- [x] `POST /api/admin/auth/refresh`
- [x] `POST /api/admin/auth/logout`
- [x] `PUT /api/admin/auth/change-password`
- [x] Admin login/session integration in FE

### 🏠 Admin Villa Management

- [x] `GET /api/admin/villas`
- [x] `POST /api/admin/villas`
- [x] `PUT /api/admin/villas/:id`
- [x] `DELETE /api/admin/villas/:id`
- [x] `POST /api/admin/villas/bulk-delete`
- [x] `POST /api/admin/villas/bulk-status`
- [x] Admin villa CRUD UI
- [x] Admin logs for main villa actions
- [x] Delete blocked if active/history booking exists

### 📤 Media Upload / Gallery

- [x] Cloudinary media upload service
- [x] `POST /api/admin/media/upload`
- [x] Villa media routes under `/api/admin/villas/:villaId/media`
- [x] Store media in `villa_media`, not a legacy JSON image field
- [x] Image/video support via `MediaType`
- [x] Media reorder, cover image, delete
- [x] `MediaUploader` / `ImageUploader` components exist
- [x] Cleanup jobs recorded in `cloudinary_cleanup_jobs`

### 📅 Availability / Blocked Dates

- [x] `GET /api/admin/blocked-dates`
- [x] `POST /api/admin/blocked-dates`
- [x] `DELETE /api/admin/blocked-dates/:id`
- [x] Admin availability manager UI
- [x] Public availability includes `blocked`

### 📅 Admin Booking Management

- [x] `GET /api/admin/bookings`
- [x] `GET /api/admin/bookings/export`
- [x] `PUT /api/admin/bookings/:id/confirm`
- [x] `PUT /api/admin/bookings/:id/cancel`
- [x] `PUT /api/admin/bookings/:id/complete`
- [x] `GET /api/admin/bookings/:id/history`
- [x] Admin bookings table/filter/actions/history
- [x] Admin actions write `admin_log`
- [x] Booking status changes write `booking_history`

### ⭐ Feedback

- [x] Public submit feedback validates booking code/phone, status, checkout, duplicate
- [x] `GET /api/admin/feedbacks`
- [x] `PUT /api/admin/feedbacks/:id/toggle`
- [x] Public villa feedback only returns verified feedback
- [x] Admin feedback management UI
- [x] Rating averages shown from API data

### 📊 Admin Dashboard / Logs / Settings

- [x] `GET /api/admin/stats`
- [x] Dashboard stats/recent booking/recent feedback/top villas
- [x] `GET /api/admin/logs`
- [x] Admin logs UI/API
- [x] `GET /api/admin/settings`
- [x] `PUT /api/admin/settings`
- [x] Admin settings UI for contact/social/common policy/hold settings

### 📧 Notification / Email

- [x] Email service files exist: `email.ts`, `emailTemplates.ts`, `notifications.ts`
- [x] SendGrid dependency/config present
- [ ] Real email delivery in production — requires verification
- [ ] Production email templates/rendering — requires verification

---

## Phase 3 — Polish, Deploy, Verification

### 🌐 Internationalization

- [x] FE i18n module exists in `FE/src/i18n`
- [x] Dictionaries exist: `vi`, `en`, `ko`, `zh`
- [x] Language context exists
- [ ] Full hardcoded-string audit complete — requires verification

### 📥 Export & Reporting

- [x] Booking CSV export API/client/UI exists
- [ ] Advanced demand analytics/reporting — pending

### 💳 Payment / Deposit Placeholder

- [x] Deposit fields in DB schema
- [x] Deposit-related FE/BE types and display support exist
- [ ] Real payment gateway integration — pending
- [ ] Production payment workflow — requires verification

### ⚡ Performance

- [x] FE build uses chunk splitting/manual chunks in Vite output
- [x] Public settings cache in FE API client
- [x] Optimized image component exists
- [ ] Production performance audit — requires verification
- [ ] CDN/cache policy verification — requires verification

### 📱 UX & Responsive

- [x] Mobile-oriented React UI/components exist
- [ ] Full device matrix test 375px/414px/tablet/desktop — requires verification
- [ ] Full end-to-end UX test in production — requires verification

### 🚀 Deploy & Test

- [ ] Backend production deploy — requires verification
- [ ] Frontend production deploy — requires verification
- [ ] Production database migration verification — requires verification
- [ ] Production Cloudinary config verification — requires verification
- [ ] End-to-end production workflow test — requires verification

### 🛡️ Security Audit

- [x] Admin route registration uses `adminAuthMiddleware`
- [x] Prisma ORM used for DB access in checked routes/services
- [x] Rate limiting exists for booking create
- [x] Error handler exists
- [ ] Full endpoint-by-endpoint security audit — requires verification
- [ ] Guest token leak audit — requires verification
- [ ] Production CORS/security headers audit — requires verification

---

## 📌 Definition of Done

Một task được coi là hoàn thành khi:

1. Code/docs đúng với kiến trúc hiện tại trong `README.md` và `rules/ARCHITECTURE.md`.
2. Không duplicate logic đã có.
3. Có error handling cho edge cases liên quan.
4. Đã test thủ công hoặc có automated check phù hợp.
5. Không break feature đã hoàn thành.
6. Không sửa ngoài scope khi chưa được duyệt.
