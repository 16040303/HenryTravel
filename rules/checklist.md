# ✅ Checklist Triển Khai — Villa Booking System v2.0

> Mỗi task chỉ được đánh dấu hoàn thành khi: code đã pass review, không break test, không duplicate logic với task khác.

---

## Phase 1 — Core MVP

> Mục tiêu: Khách có thể xem villa, đặt phòng qua Zalo, tra cứu booking. Admin xác nhận thủ công.

### 🗄️ Database

- [x] Tạo Prisma schema đầy đủ theo v2:
  - [x] Bảng `users` (bao gồm `is_guest`, `guest_token`)
  - [x] Bảng `villas` (bao gồm `hold_minutes`, `deposit_required`, `deposit_amount`, `max_guests`)
  - [x] Bảng `bookings` (bao gồm `booking_code`, `guest_token`, `hold_expire_at`, `deposit_*`)
  - [x] Bảng `zalo_messages`
  - [x] Bảng `feedbacks`
  - [x] Bảng `admin_logs`
  - [x] Bảng `booking_history`
  - [x] Bảng `booking_attempts` (rate limiting)
  - [x] Bảng `system_settings` (Zalo/settings DB-first)
- [x] Tạo toàn bộ DB indexes (xem mục 3.9 trong plan)
- [x] Seed data: 3–5 villa mẫu với đủ thông tin

### 🔐 Auth

- [x] JWT middleware cho admin (Bearer token, expire 8h)
- [ ] Refresh token flow cho admin
- [x] `guest_token` UUID v4 — tạo khi booking, lưu vào cookie
- [x] Middleware xác thực route admin (`/admin/*`)

### 🏠 Backend — Villa

- [x] `GET /villas` — danh sách + filter (location, giá, tiện ích, ngày available)
- [x] `GET /villas/:id` — chi tiết, tăng `views_count`
- [x] `GET /villas/:id/availability` — trả calendar booked/pending/available
- [x] `GET /villas/:id/feedbacks` — chỉ trả feedback `verified = true`

### 📅 Backend — Booking

- [x] `POST /bookings` — tạo `pending_hold`, sinh `booking_code` (VB-YYYY-NNN), sinh `guest_token`, build link Zalo
- [x] Rate limiting `POST /bookings`: max 3 lần/IP/15 phút + max 2 lần/SĐT/giờ (ghi vào `booking_attempts`)
- [x] `GET /bookings/check` — tra cứu bằng `booking_code` + `phone`
- [x] Validate: check-in < check-out, guests_count ≤ max_guests, không overlap booking confirmed/pending

### ⚙️ Background Job

- [x] Job chạy mỗi 1 phút: scan `pending_hold` hết hạn (`hold_expire_at < NOW()`)
- [x] Auto set `status = 'cancelled'`, ghi vào `booking_history`, phòng trở lại available
- [x] Log lỗi job nếu fail, không làm crash server

### 📱 Zalo Link Builder

- [x] Service tạo 3 loại link: `zalo://`, `zalo.me`, `zalo.me?text=`
- [x] Encode message đầy đủ: tên villa, ngày, số khách, mã booking
- [x] Lưu 3 link vào bảng `zalo_messages`
- [x] Zalo phone/settings đọc từ `system_settings`, env chỉ là fallback
- [x] Public endpoint `GET /settings/public` cho footer/detail/booking links

### 🖥️ Frontend — User Pages

- [x] **Home (`/`)**: widget check-in/check-out + số khách/phòng + filter nâng cao
- [x] **Danh sách villa (`/villas`)**: VillaCard + CalendarMini + filter từ Home
- [x] **Chi tiết villa (`/villas/:id`)**: Gallery + tiện ích + BookingForm pre-fill + ZaloLinkButton
- [x] **Booking Success (`/booking/success`)**: mã booking + CountdownTimer hold + nút Zalo + link tra cứu
- [x] **Tra cứu booking (`/booking/check`)**: input mã + SĐT → hiển thị trạng thái
- [x] Public FE API integration: home/list/detail/booking/lookup/settings/feedback nối API thật
- [x] Scroll behavior fix khi chuyển view/trang

### 🧩 Components (Phase 1)

- [ ] `VillaCard` — ảnh, tên, tiện ích tóm tắt, giá, rating trung bình
- [ ] `CalendarMini` — booked (đỏ) / pending (vàng) / available (xanh) + tooltip
- [ ] `BookingForm` — pre-fill từ Home, disabled dates với tooltip
- [ ] `ZaloLinkButton` — 3 lớp fallback, hiển thị SĐT rõ ràng
- [ ] `CountdownTimer` — đếm ngược hold time còn lại
- [ ] `BookingStatusBadge` — badge hiển thị trạng thái

---

## Phase 2 — Admin & Feedback

> Mục tiêu: Admin có thể quản lý toàn bộ hệ thống. Feedback được kiểm soát chặt.

### 🔑 Admin Auth

- [x] `POST /admin/auth/login` — trả JWT
- [ ] `POST /admin/auth/refresh` — làm mới token
- [x] Trang login admin (`/admin/login`) với form + error handling

### 🏠 Admin — Quản lý Villa

- [x] `GET /admin/villas` — danh sách + thống kê views/booking/feedback
- [x] `POST /admin/villas` — tạo villa mới
- [x] `PUT /admin/villas/:id` — sửa villa (tên, giá, hold_minutes, trạng thái, tiện ích)
- [x] `DELETE /admin/villas/:id` — xóa villa (soft delete hoặc hard delete nếu không có booking)
- [x] Trang admin villas với form CRUD, preview gallery
- [x] Admin FE API integration cho villas

### 📤 Image Upload

- [ ] `POST /admin/upload` — nhận multipart, validate (type, size ≤ 5MB, max 20 ảnh/villa)
- [ ] Upload lên Supabase Storage / S3, trả CDN URL
- [ ] Component `ImageUploader` — multi-file, client resize (max 1920px, quality 85%), preview + delete

### 📅 Admin — Quản lý Booking

- [x] `GET /admin/bookings` — filter theo villa/ngày/status/SĐT
- [x] `PUT /admin/bookings/:id/confirm` — xác nhận booking, ghi booking_history
- [x] `PUT /admin/bookings/:id/cancel` — huỷ booking, ghi booking_history
- [x] `PUT /admin/bookings/:id/complete` — hoàn tất booking, ghi booking_history
- [x] `GET /admin/bookings/:id/history` — lịch sử thay đổi trạng thái
- [x] Trang admin bookings với bảng filter + action confirm/cancel/complete + xem history
- [x] Admin actions ghi `admin_log` cho thao tác quản trị chính

### ⭐ Feedback

- [x] `POST /feedbacks` — validate đủ điều kiện (confirmed/completed + checked-out + chưa review)
- [x] `GET /admin/feedbacks` — danh sách theo villa, rating, comment
- [x] `PUT /admin/feedbacks/:id/toggle` — ẩn/hiện feedback (soft delete)
- [x] Hiển thị FeedbackList trên trang chi tiết villa (chỉ verified = true)
- [x] Component `FeedbackList` + `RatingStars`
- [x] Tính điểm trung bình hiển thị trên VillaCard và VillaDetail
- [x] Villa feedback loading từ API thật `GET /villas/:id/feedbacks`

### 📊 Admin Dashboard

- [x] Thống kê tổng quan: tổng villa, booking tuần/tháng, feedback mới, pending chờ xử lý
- [x] Biểu đồ: lượt xem theo villa, booking theo trạng thái, rating trung bình
- [x] Alert: pending booking mới (badge + notification banner)
- [x] Component `StatsChart`, `AlertBanner`, `AdminTable`
- [x] Admin FE API integration cho dashboard/bookings/feedback/settings

### 📧 Notification / Email

- [ ] Email template: pending alert cho admin
- [ ] Email template: confirmed cho admin + khách
- [ ] Email template: cancelled cho khách
- [ ] Email template: feedback mới cho admin
- [ ] Tích hợp SendGrid (fallback Nodemailer + Gmail SMTP)

---

## Phase 3 — Polish & Scale

> Mục tiêu: Hoàn thiện UX, tối ưu hiệu năng, sẵn sàng production.

### 🔔 Real-time Alert Admin

- [ ] In-app notification cho admin khi có booking pending mới
- [ ] Polling mỗi 30 giây (hoặc WebSocket nếu cần real-time thực sự)
- [ ] Badge đếm số pending chưa xử lý trên nav admin

### 📥 Export & Báo cáo

- [ ] `GET /admin/bookings/export` — export CSV booking history (filter theo ngày/villa/status)
- [ ] Phân tích pending/cancelled: báo cáo nhu cầu theo villa, theo mùa

### 💳 Payment Placeholder

- [ ] Deposit fields đã có trong DB schema (`deposit_status`, `deposit_method`, `deposit_paid_at`)
- [ ] UI hiển thị thông tin đặt cọc khi `villa.deposit_required = true`
- [ ] Placeholder UI cho các phương thức: bank_transfer / momo / vnpay (chưa tích hợp thực)
- [ ] Admin có thể set `deposit_status` thủ công

### ⚡ Performance

- [ ] Lazy loading danh sách villa (infinite scroll hoặc pagination)
- [ ] CDN cache ảnh (Supabase CDN / Cloudflare)
- [ ] API response caching cho danh sách villa (5 phút)
- [ ] Image optimization với Next.js Image component

### 📱 UX & Responsive

- [ ] Test responsive toàn bộ trang trên mobile (375px, 414px)
- [ ] Touch-friendly: nút Zalo nổi bật, form dễ nhập trên mobile
- [ ] CalendarMini hiển thị tốt trên màn nhỏ
- [ ] Kiểm tra UX flow tổng thể: Home → Danh sách → Chi tiết → Booking → Success → Tra cứu

### 🚀 Deploy & Test

- [ ] Deploy backend lên Render (set env vars)
- [ ] Deploy frontend lên Vercel (set env vars)
- [ ] Setup Supabase production (DB + Storage)
- [ ] Test workflow end-to-end: đặt phòng → Zalo → admin confirm → email → checkout → feedback
- [ ] Test auto-release hold job trên production
- [ ] Test rate limiting thực tế
- [ ] Kiểm tra CORS, SSL, security headers

### 🛡️ Security Audit

- [ ] Review tất cả API endpoints: có đúng auth middleware chưa?
- [ ] Kiểm tra SQL injection: toàn bộ query qua Prisma/parameterized?
- [ ] Validate file upload trên production
- [ ] Test guest_token không bị leak qua response không cần thiết
- [ ] Review admin_logs có ghi đầy đủ chưa

---

## 📌 Definition of Done

Một task được coi là **hoàn thành** khi:

1. Code implement đúng theo kiến trúc trong `README.md` và `ARCHITECTURE.md`
2. Không duplicate logic đã có ở nơi khác
3. Có error handling cho các edge case (null, timeout, invalid input)
4. Đã test thủ công hoặc có unit test
5. Không break các feature đã hoàn thành ở phase trước
6. Đã đọc `.cursorrules` trước khi bắt đầu task
