# Villa/Homestay Booking Web – Tổng Quan Hệ Thống (v2.0)

> **Cập nhật:** Bổ sung Auth/Guest token, Rate limiting, Feedback validation, Payment placeholder, Zalo fallback, Image upload flow, Hold time linh hoạt, Trang tra cứu booking.

---

## 1. Mục tiêu dự án

- Khách xem villa/homestay, hình ảnh, tiện ích, giá dự kiến.
- Đặt lịch xem/ở qua **Zalo** với link điền sẵn thông tin (có fallback đa nền tảng).
- Hệ thống **hold booking tạm thời (configurable per villa)** → tránh overbooking.
- Admin/cho thuê quản lý villa, giá, trạng thái, thống kê, booking.
- **Feedback & rating** tích hợp trực tiếp trên trang chi tiết villa — chỉ khách đã check-out mới được đánh giá.
- UX kiểu Agoda/Booking.com: chọn ngày + số khách ngay Home, filter nâng cao, pre-fill form booking.
- **Guest checkout** — không bắt buộc đăng ký, khách tra cứu booking bằng mã + SĐT.
- Alert tự động cho admin, lưu lịch sử pending/cancelled → phân tích nhu cầu, tối ưu giá, marketing.

---

## 2. Workflow Booking

### 2.1 User Flow

```
[Home] → Chọn check-in/check-out + số khách/phòng + filter
    ↓
[Danh sách villa] → Villa card + calendar mini (booked/pending/available)
    ↓
[Chi tiết villa] → Pre-fill form từ Home → Feedback & rating
    ↓
[Submit booking] → Tạo pending_hold + guest_token + link Zalo
    ↓
[Nút Contact Zalo] → Zalo mở với tin nhắn điền sẵn (fallback: zalo.me / SĐT)
    ↓
[Admin xác nhận] → status = confirmed → Email gửi khách + admin
    ↓
[Khách check-out] → Mở khóa form Feedback & Rating
    ↓
[Auto release] → pending_hold hết hạn → status = cancelled → Available
```

### 2.2 Admin Flow

```
[Dashboard] → Thống kê villa / booking / feedback / revenue
    ↓
[Alert] → Booking pending mới → Email / In-app notification
    ↓
[Quản lý villa] → CRUD + set giá + hold_minutes + gallery + tiện ích
    ↓
[Quản lý booking] → Filter status/ngày/villa → Confirm / Cancel
    ↓
[Lịch sử] → Xem pending/cancelled history → Phân tích nhu cầu
    ↓
[Feedback] → Xem rating + comment → Chỉ verified = true mới hiển thị
```

---

## 3. Database Design

### 3.1 Bảng `users`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Tên |
| `email` | VARCHAR | Email (unique) |
| `phone` | VARCHAR | Số điện thoại |
| `role` | ENUM | `user` / `admin` |
| `is_guest` | BOOLEAN | `true` = guest checkout |
| `guest_token` | VARCHAR | UUID dùng để tra cứu booking (guest) |
| `created_at` | TIMESTAMP | |

### 3.2 Bảng `villas`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Tên villa |
| `location` | VARCHAR | Địa điểm |
| `description` | TEXT | Mô tả |
| `status` | ENUM | `available` / `maintenance` / `hidden` |
| `price` | DECIMAL | Giá (0 = liên hệ) |
| `price_type` | ENUM | `fixed` / `contact` |
| `facilities` | JSONB | Tiện ích (pool, wifi, parking...) |
| `images` | JSONB | Mảng URL ảnh (Supabase/S3) |
| `views_count` | INT | Lượt xem |
| `hold_minutes` | INT | Thời gian giữ chỗ (mặc định 15) |
| `deposit_required` | BOOLEAN | Có yêu cầu đặt cọc không |
| `deposit_amount` | DECIMAL | Số tiền đặt cọc |
| `max_guests` | INT | Sức chứa tối đa |
| `created_at` | TIMESTAMP | |

### 3.3 Bảng `bookings`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `booking_code` | VARCHAR | Mã tra cứu (VD: VB-2024-001) |
| `user_id` | UUID | FK → users (nullable nếu guest) |
| `villa_id` | UUID | FK → villas |
| `guest_name` | VARCHAR | Tên khách (guest checkout) |
| `guest_phone` | VARCHAR | SĐT khách |
| `guest_email` | VARCHAR | Email khách |
| `guest_token` | VARCHAR | Token tra cứu (guest) |
| `check_in` | DATE | Ngày nhận phòng |
| `check_out` | DATE | Ngày trả phòng |
| `guests_count` | INT | Số khách |
| `rooms_count` | INT | Số phòng (default 1) |
| `special_request` | TEXT | Yêu cầu đặc biệt |
| `status` | ENUM | `pending_hold` / `confirmed` / `cancelled` |
| `source` | ENUM | `web` / `admin_manual` |
| `hold_expire_at` | TIMESTAMP | Thời điểm hết hạn giữ chỗ |
| `deposit_status` | ENUM | `none` / `pending` / `paid` / `refunded` |
| `deposit_method` | VARCHAR | `bank_transfer` / `momo` / `vnpay` / null |
| `deposit_paid_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

### 3.4 Bảng `zalo_messages`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | |
| `booking_id` | UUID | FK → bookings |
| `message_url_mobile` | TEXT | zalo:// scheme |
| `message_url_web` | TEXT | zalo.me link |
| `message_url_fallback` | TEXT | zalo.me?text= encoded |
| `sent_at` | TIMESTAMP | |

### 3.5 Bảng `feedbacks`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | |
| `booking_id` | UUID | FK → bookings (unique — 1 booking 1 review) |
| `villa_id` | UUID | FK → villas |
| `rating` | INT | 1–5 sao |
| `comment` | TEXT | Nội dung đánh giá |
| `verified` | BOOLEAN | `true` nếu đủ điều kiện (confirmed + đã check-out) |
| `created_at` | TIMESTAMP | |

> **Điều kiện submit feedback:**
> 1. `booking.status = 'confirmed'`
> 2. `booking.check_out < NOW()`
> 3. Chưa tồn tại feedback cho `booking_id` này

### 3.6 Bảng `admin_logs`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | |
| `admin_id` | UUID | FK → users |
| `action` | VARCHAR | Hành động thực hiện |
| `target_type` | VARCHAR | `villa` / `booking` / `user` |
| `target_id` | UUID | ID đối tượng bị tác động |
| `ip_address` | VARCHAR | IP admin (audit security) |
| `user_agent` | VARCHAR | Thiết bị sử dụng |
| `timestamp` | TIMESTAMP | |

### 3.7 Bảng `booking_history`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | |
| `booking_id` | UUID | FK → bookings |
| `status` | VARCHAR | Trạng thái tại thời điểm |
| `changed_by` | UUID | Admin ID hoặc system |
| `note` | TEXT | Ghi chú |
| `timestamp` | TIMESTAMP | |

### 3.8 Bảng `booking_attempts` *(Rate limiting)*

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | |
| `ip_address` | VARCHAR | IP người dùng |
| `phone` | VARCHAR | SĐT dùng để submit |
| `villa_id` | UUID | Villa đang book |
| `attempted_at` | TIMESTAMP | |

### 3.9 DB Indexes

```sql
CREATE INDEX idx_bookings_villa_id      ON bookings(villa_id);
CREATE INDEX idx_bookings_user_id       ON bookings(user_id);
CREATE INDEX idx_bookings_check_in      ON bookings(check_in);
CREATE INDEX idx_bookings_status        ON bookings(status);
CREATE INDEX idx_bookings_hold_expire   ON bookings(hold_expire_at) WHERE status = 'pending_hold';
CREATE INDEX idx_bookings_code          ON bookings(booking_code);
CREATE INDEX idx_feedbacks_villa_id     ON feedbacks(villa_id);
CREATE INDEX idx_attempts_ip_time       ON booking_attempts(ip_address, attempted_at);
CREATE INDEX idx_attempts_phone_time    ON booking_attempts(phone, attempted_at);
```

---

## 4. Backend (Node.js + Express)

### 4.1 Auth

```
Admin:   JWT (riêng biệt)       → Authorization: Bearer <token>
Guest:   guest_token (UUID)     → Query param hoặc cookie
User:    Optional account       → JWT nếu đã tạo tài khoản
```

### 4.2 User Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/villas` | Danh sách + filter + ngày booked/pending |
| GET | `/villas/:id` | Chi tiết villa, tăng `views_count` |
| GET | `/villas/:id/feedbacks` | Feedback đã verified của villa |
| GET | `/villas/:id/availability` | Calendar booked/pending/available |
| POST | `/bookings` | Tạo pending_hold → trả link Zalo (Rate limited) |
| GET | `/bookings/check` | Tra cứu bằng `booking_code` + `phone` |
| POST | `/feedbacks` | Submit feedback (validate đủ điều kiện) |

### 4.3 Admin Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/admin/auth/login` | Đăng nhập admin |
| GET | `/admin/villas` | Danh sách + thống kê lượt xem/booking/feedback |
| POST | `/admin/villas` | Thêm villa |
| PUT | `/admin/villas/:id` | Sửa villa, set giá, hold_minutes, trạng thái |
| DELETE | `/admin/villas/:id` | Xóa villa |
| POST | `/admin/upload` | Upload ảnh → Supabase/S3 |
| GET | `/admin/bookings` | Danh sách booking + filter |
| PUT | `/admin/bookings/:id/confirm` | Xác nhận booking |
| PUT | `/admin/bookings/:id/cancel` | Huỷ booking |
| GET | `/admin/booking_history` | Lịch sử pending/cancelled |
| GET | `/admin/feedbacks` | Thống kê + xem feedback |
| GET | `/admin/logs` | Log thao tác admin |

### 4.4 Rate Limiting — `POST /bookings`

```
Per IP:    tối đa 5 booking / 1 giờ
Per Phone: tối đa 3 booking / 24 giờ
Vượt giới hạn → HTTP 429 + thông báo thân thiện trên UI
```

### 4.5 Zalo Link Builder

```javascript
function createZaloLink(phone, bookingInfo) {
  const message = `Xin chào, tôi muốn xác nhận đặt phòng:
- Mã booking: ${bookingInfo.code}
- Villa: ${bookingInfo.villaName}
- Check-in: ${bookingInfo.checkIn}
- Check-out: ${bookingInfo.checkOut}
- Họ tên: ${bookingInfo.guestName}`;

  const encoded = encodeURIComponent(message);
  return {
    mobile:   `zalo://conversation?phone=${phone}`,
    web:      `https://zalo.me/${phone}`,
    fallback: `https://zalo.me/${phone}?text=${encoded}`
  };
}
```

**UI xử lý fallback:**
- Mobile: thử `zalo://` → timeout 2s → fallback `zalo.me`
- Desktop: mở `zalo.me` trực tiếp
- Luôn hiển thị SĐT rõ ràng để khách copy thủ công nếu cần

### 4.6 Hold Time — Background Job

```
Mỗi 1 phút → Scan bookings WHERE status = 'pending_hold' AND hold_expire_at < NOW()
  → Cập nhật status = 'cancelled'
  → Ghi vào booking_history
  → Phòng trở lại Available
```

Hold time lấy từ `villa.hold_minutes` (mặc định 15 nếu không set).

### 4.7 Feedback Validation

```javascript
// POST /feedbacks
async function submitFeedback(booking_id, rating, comment) {
  const booking = await getBooking(booking_id);

  if (booking.status !== 'confirmed')        throw Error('403: Booking chưa được xác nhận');
  if (new Date(booking.check_out) > new Date()) throw Error('403: Chưa đến ngày check-out');
  if (await feedbackExists(booking_id))      throw Error('409: Đã đánh giá booking này rồi');

  await insertFeedback({ booking_id, villa_id: booking.villa_id, rating, comment, verified: true });
}
```

### 4.8 Image Upload Flow

```
Client resize ảnh (canvas API, max 1920px, quality 85%)
  → POST /admin/upload (multipart/form-data)
  → Backend validate: type ∈ [jpeg/png/webp], size ≤ 5MB, max 20 ảnh/villa
  → Upload → Supabase Storage / AWS S3
  → Trả về public CDN URL
  → Lưu URL vào villas.images (JSONB array)
```

### 4.9 Notification / Email

| Sự kiện | Nhận | Kênh |
|---------|------|------|
| Booking pending mới | Admin | Email + In-app alert |
| Booking confirmed | Admin + Khách | Email |
| Booking cancelled (auto/manual) | Khách | Email |
| Feedback mới | Admin | Email |

---

## 5. Frontend (React / Next.js)

### 5.1 Trang User

**Home (`/`)**
- Widget chọn check-in/check-out + số khách/số phòng
- Filter nâng cao: location, giá, tiện ích, loại villa
- Kết quả filter → chuyển sang trang danh sách

**Danh sách villa (`/villas`)**
- VillaCard: ảnh, tên, tiện ích tóm tắt, giá dự kiến, rating trung bình
- CalendarMini: hiển thị booked (đỏ) / pending (vàng) / available (xanh)
- Pagination / lazy loading

**Chi tiết villa (`/villas/:id`)**
- Gallery ảnh
- Tiện ích, mô tả, chính sách
- BookingForm: pre-fill từ Home filter, ngày booked/pending → disabled + tooltip
- Nút Contact Zalo (link 3 lớp, hiển thị SĐT rõ ràng)
- FeedbackList: danh sách rating + comment (chỉ verified = true)
- Điểm trung bình 1–5 sao

**Booking Success (`/booking/success`)**
- Mã booking + thông tin tóm tắt
- Nút Contact Zalo (nổi bật)
- Countdown hold time còn lại
- Link tra cứu trạng thái

**Tra cứu booking (`/booking/check`)**
- Input: mã booking + SĐT
- Output: trạng thái, thời gian còn lại (nếu pending), link Zalo (nếu chưa liên hệ)

### 5.2 Trang Admin

**Dashboard (`/admin`)**
- Thống kê: tổng villa, booking tuần/tháng, feedback mới, pending chờ xử lý
- Biểu đồ: lượt xem theo villa, booking theo trạng thái, rating trung bình
- Alert: pending booking mới (badge + notification)

**Quản lý villa (`/admin/villas`)**
- CRUD villa: tên, địa điểm, mô tả, giá, hold_minutes, tiện ích, gallery
- Upload ảnh multi-file
- Set trạng thái: available / maintenance / hidden

**Quản lý booking (`/admin/bookings`)**
- Filter: villa / ngày / status / SĐT
- Confirm / Cancel từng booking
- Xem lịch sử thay đổi trạng thái (booking_history)
- Export CSV

**Feedback (`/admin/feedbacks`)**
- Danh sách comment + rating theo villa
- Thống kê: điểm trung bình, phân bổ sao
- Ẩn/hiện feedback (soft delete)

**Log (`/admin/logs`)**
- Lịch sử thao tác admin: IP, thiết bị, hành động, thời gian

### 5.3 Components

| Component | Mô tả |
|-----------|-------|
| `VillaCard` | Hiển thị trong danh sách |
| `VillaDetail` | Trang chi tiết |
| `BookingForm` | Form đặt phòng + pre-fill |
| `ZaloLinkButton` | Nút Zalo với fallback 3 lớp |
| `CalendarMini` | Calendar booked/pending/available |
| `FeedbackList` | Danh sách review |
| `RatingStars` | Component chọn / hiển thị sao |
| `CountdownTimer` | Đếm ngược hold time |
| `BookingStatusBadge` | Badge trạng thái |
| `AdminTable` | Bảng dữ liệu admin có filter/sort |
| `StatsChart` | Biểu đồ thống kê (Recharts) |
| `ImageUploader` | Multi-file upload + preview |
| `AlertBanner` | In-app notification admin |

---

## 6. UX Nâng Cấp

| Tính năng | Mô tả |
|-----------|-------|
| Pre-fill form | Thông tin từ Home filter tự động điền vào BookingForm |
| Calendar mini | Booked (đỏ) / Pending (vàng) / Available (xanh) — tooltip giải thích |
| Disabled dates | Ngày booked/pending → strike-through, không chọn được |
| Countdown hold | Khách thấy còn bao nhiêu phút giữ chỗ |
| Guest checkout | Không cần đăng ký tài khoản |
| Booking lookup | Tra cứu bằng mã + SĐT, giảm tải hỏi qua Zalo |
| Feedback verified | Chỉ khách đã ở mới review → tăng trust |
| Mobile-first | Responsive, touch-friendly, nút Zalo nổi bật |

---

## 7. Cloud & Deploy

| Thành phần | Dịch vụ đề xuất | Dự phòng |
|------------|-----------------|---------|
| Database | Supabase (PostgreSQL) | Railway / Render |
| Backend | Render (Node.js) | Railway |
| Frontend | Vercel (Next.js) | Netlify |
| Storage ảnh | Supabase Storage | AWS S3 |
| Email | SendGrid | Nodemailer + Gmail SMTP |
| CDN ảnh | Supabase CDN tích hợp | Cloudflare |
| SSL | Auto (cloud provider) | Let's Encrypt |

---

## 8. Bảo Mật & Tối Ưu

| Hạng mục | Giải pháp |
|----------|----------|
| Auth admin | JWT + refresh token, expire 8 giờ |
| Guest token | UUID v4, không đoán được |
| Rate limiting | Per IP + per SĐT trên `POST /bookings` |
| Input validation | Check-in < check-out, số khách ≤ max_guests, email/phone format |
| SQL injection | ORM (Prisma / Sequelize) hoặc parameterized queries |
| File upload | Validate type + size trước khi lên S3 |
| Admin IP log | Ghi lại IP mọi thao tác admin |
| CORS | Chỉ cho phép domain frontend |
| Pagination | Tất cả danh sách (villas, bookings, feedbacks) |
| DB Index | Đã liệt kê ở mục 3.9 |
| Background job | Chạy mỗi 1 phút, auto release pending_hold hết hạn |

---

## 9. Checklist Triển Khai

### Phase 1 — Core (MVP)
- [ ] DB schema đầy đủ theo v2 (bao gồm guest_token, booking_code, hold_minutes, deposit fields)
- [ ] Auth: JWT admin + guest_token flow
- [ ] Backend API: CRUD villa + booking + feedback validation + Zalo link builder
- [ ] Rate limiting `POST /bookings` (per IP + per phone)
- [ ] Background job auto release pending_hold
- [ ] Frontend: Home widget + danh sách villa + chi tiết villa + booking form pre-fill
- [ ] Trang booking success với countdown hold + nút Zalo
- [ ] Trang tra cứu booking (`/booking/check`)
- [ ] Nút Contact Zalo với fallback 3 lớp

### Phase 2 — Admin & Feedback
- [ ] Admin dashboard: thống kê, CRUD villa, hold_minutes config
- [ ] Admin booking management: filter, confirm, cancel, history
- [ ] Image upload flow (client resize → backend validate → S3/Supabase)
- [ ] Feedback & rating: submit (validate điều kiện) + hiển thị (verified only)
- [ ] Notification/email: pending alert, confirmed, cancelled

### Phase 3 — Polish & Scale
- [ ] Alert in-app admin (WebSocket hoặc polling)
- [ ] Export CSV booking history
- [ ] Phân tích pending/cancelled → báo cáo nhu cầu
- [ ] Payment placeholder (deposit fields sẵn sàng)
- [ ] Lazy loading, CDN cache ảnh
- [ ] Test responsive mobile + UX kiểu Agoda/Booking.com
- [ ] Deploy full stack + test workflow end-to-end

---

## 10. Kết Luận

| Điểm mạnh | Chi tiết |
|-----------|---------|
| Tránh overbooking | pending_hold + hold_minutes configurable per villa |
| UX liền mạch | Pre-fill form, calendar mini, countdown timer |
| Phù hợp thị trường VN | Zalo với fallback 3 lớp + hiển thị SĐT rõ ràng |
| Không bắt đăng ký | Guest checkout + tra cứu bằng mã booking + SĐT |
| Feedback chất lượng | Chỉ khách đã check-out mới review → không fake |
| Admin kiểm soát đầy đủ | CRUD, alert, log IP, booking history, thống kê |
| Sẵn sàng mở rộng | Deposit placeholder, rate limiting, DB index đầy đủ |
| Bảo mật cơ bản | JWT, guest_token, rate limit, input validate, IP log |
