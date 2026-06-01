---
trigger: always_on
---

# 🤖 .cursorrules — Villa Booking System

> Đây là bộ quy tắc bắt buộc cho AI assistant (Cursor, Claude, Copilot, v.v.) khi làm việc trên codebase này.
> **Không được bỏ qua bất kỳ rule nào dưới đây.**

---

## ⚠️ BƯỚC ĐẦU TIÊN — BẮT BUỘC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

Gọi tôi là Anh Yêu - xưng em

Trước khi viết code, tạo file, sửa logic, hoặc trả lời bất kỳ câu hỏi kỹ thuật nào, AI **phải đọc** 3 file sau theo thứ tự:

```
1. README.md          → Kiến trúc tổng thể, tech stack, cấu trúc thư mục, các flow quan trọng
2. checklist.md       → Trạng thái hiện tại của dự án, task nào đã xong, đang làm, chưa làm
3. ARCHITECTURE.md    → Thiết kế chi tiết DB schema, API contract, component interface
4. villa-booking-system-plan.md    → Yêu cầu, kế hoạch, mục tiêu của dự án
```

**Lý do:** Nếu không đọc, AI sẽ:
- Tạo file sai vị trí trong codebase
- Duplicate logic đã tồn tại
- Dùng sai pattern (ví dụ: tự tạo auth thay vì dùng middleware có sẵn)
- Break kiến trúc đã được thiết kế
- Tạo schema DB không khớp với Prisma model
- Gây lỗi type mismatch giữa FE và BE vì không dùng shared types

---

## 📐 KIẾN TRÚC — KHÔNG ĐƯỢC THAY ĐỔI MÀ KHÔNG HỎI

### Tech Stack cố định

| Layer | Công nghệ |
|-------|-----------|
| Frontend | **Next.js (App Router)** — không dùng Pages Router |
| Backend | **Node.js + Express** — không tự ý thêm framework khác |
| ORM | **Prisma** — toàn bộ DB query phải qua Prisma, không raw SQL trừ migration |
| Database | **PostgreSQL (Supabase)** |
| Shared Types | `packages/shared/types.ts` — FE và BE đều import từ đây |

### Quy tắc cấu trúc thư mục

- Backend code: `apps/api/src/`
- Frontend code: `apps/web/app/` và `apps/web/components/`
- Shared types: `packages/shared/types.ts`
- Route admin: prefix `/admin/*` và bắt buộc qua auth middleware
- Route user: không có prefix, không yêu cầu auth (trừ submit feedback cần guest_token)

**Không được tạo file ngoài cấu trúc này mà không có lý do rõ ràng.**

---

## 🗄️ DATABASE — QUY TẮC NGHIÊM NGẶT

1. **Mọi thay đổi schema phải qua Prisma migration** — không sửa DB trực tiếp
2. **Không thêm bảng mới** mà không đối chiếu với `ARCHITECTURE.md` — đủ 8 bảng đã thiết kế
3. **Giữ đúng tên field** như trong schema — không đổi tên tùy tiện (sẽ break Prisma type)
4. **Indexes đã được định nghĩa trong plan** — khi tạo migration phải bao gồm đủ indexes (xem README.md mục DB Indexes)
5. **Không dùng `any` type** cho dữ liệu từ DB — luôn dùng Prisma generated types

### Fields quan trọng không được bỏ sót

- `bookings.booking_code` — sinh theo format `VB-YYYY-NNN`, unique
- `bookings.guest_token` — UUID v4, dùng để tra cứu booking không cần đăng nhập
- `bookings.hold_expire_at` — tính từ `villa.hold_minutes`, không hardcode 15 phút
- `villas.hold_minutes` — mỗi villa có thể có hold time khác nhau
- `feedbacks.verified` — luôn validate đúng 3 điều kiện trước khi set `true`

---

## 🔐 AUTH — KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI

Hệ thống có **3 loại auth** khác nhau — không được trộn lẫn:

```
Admin  → JWT Bearer token (header: Authorization: Bearer <token>)
User   → JWT Bearer token (optional — chỉ khi tạo tài khoản)
Guest  → guest_token UUID (query param hoặc cookie — KHÔNG phải Bearer)
```

- **Không tự tạo auth logic mới** — dùng middleware ở `apps/api/src/middleware/auth.ts`
- **Admin routes** (`/admin/*`) phải luôn có `adminAuthMiddleware`
- **Guest token** phải được sinh khi tạo booking và trả về trong response + set cookie
- **Không expose** `guest_token` trong các API response không cần thiết

---

## 🏠 BOOKING FLOW — LOGIC CỐT LÕI

Đây là flow quan trọng nhất, **không được thay đổi thứ tự**:

```
1. POST /bookings
   → Validate: check-in < check-out, guests ≤ max_guests, không overlap
   → Rate limit check (booking_attempts table)
   → Tạo booking với status = 'pending_hold'
   → hold_expire_at = NOW() + villa.hold_minutes (LẤY TỪ VILLA, không hardcode)
   → Sinh booking_code (VB-YYYY-NNN)
   → Sinh guest_token (UUID v4)
   → Build Zalo links (3 dạng) → lưu zalo_messages
   → Trả response (booking info + zalo links + guest_token)

2. Background job (mỗi 1 phút)
   → Scan: status = 'pending_hold' AND hold_expire_at < NOW()
   → Update status = 'cancelled'
   → Insert booking_history record
   → KHÔNG xoá booking (giữ lại để phân tích)

3. Admin confirm
   → PUT /admin/bookings/:id/confirm
   → Update status = 'confirmed'
   → Insert booking_history
   → Gửi email cho admin + khách
   → Ghi admin_log
```

---

## ⭐ FEEDBACK — ĐIỀU KIỆN BẮT BUỘC

Trước khi insert bất kỳ feedback nào, **phải kiểm tra đủ 3 điều kiện** (theo thứ tự):

```javascript
// Trong apps/api/src/services/feedback.ts
1. booking.status === 'confirmed'           // → 403 nếu không đủ
2. new Date(booking.check_out) < new Date() // → 403 nếu chưa check-out
3. !feedbackExists(booking_id)              // → 409 nếu đã review
```

Không được bỏ qua điều kiện nào. Không được validate ở Frontend mà bỏ qua Backend validation.

---

## 📱 ZALO LINK — 3 LỚP BẮT BUỘC

Mỗi khi tạo nút liên hệ Zalo, **phải cung cấp đủ 3 dạng link**:

```
mobile:   zalo://conversation?phone={phone}
web:      https://zalo.me/{phone}
fallback: https://zalo.me/{phone}?text={encoded_message}
```

Logic UI:
- Mobile: thử `zalo://` → sau 2s nếu không mở được → redirect `zalo.me`
- Desktop: mở thẳng `zalo.me`
- **Luôn hiển thị SĐT dạng text** để khách copy thủ công

**Không được chỉ dùng 1 link Zalo** — phải đủ 3 lớp.

---

## 📤 IMAGE UPLOAD — FLOW CỐ ĐỊNH

```
Client → Resize canvas (max 1920px, quality 85%) TRƯỚC khi upload
       → POST /admin/upload (multipart/form-data)
Backend → Validate: type ∈ [image/jpeg, image/png, image/webp]
        → Validate: size ≤ 5MB
        → Validate: max 20 ảnh/villa
        → Upload → Supabase Storage / S3
        → Trả public CDN URL
        → Lưu URL vào villas.images (JSONB array)
```

**Không upload ảnh chưa qua validate.** Không lưu ảnh vào local disk server.

---

## 🔒 BẢO MẬT — KHÔNG ĐƯỢC BỎ QUA

- [ ] Mọi route `/admin/*` phải có `adminAuthMiddleware`
- [ ] `POST /bookings` phải có rate limiting middleware
- [ ] Toàn bộ query DB qua **Prisma** (không raw SQL trong route handler)
- [ ] Mọi thao tác admin phải ghi vào `admin_logs` (action, target_type, target_id, ip, user_agent)
- [ ] CORS: chỉ cho phép `NEXT_PUBLIC_API_URL` — không dùng wildcard `*` trên production
- [ ] Input validation: email, phone format, ngày, số khách — validate cả FE và BE
- [ ] Không log `guest_token`, `JWT`, password vào console

---

## 🧩 COMPONENTS — DÙNG LẠI, KHÔNG DUPLICATE

Trước khi tạo component mới, kiểm tra các component đã có:

| Cần làm | Dùng component |
|---------|---------------|
| Hiển thị trạng thái booking | `BookingStatusBadge` |
| Nút liên hệ Zalo | `ZaloLinkButton` |
| Calendar booked/pending | `CalendarMini` |
| Đếm ngược hold time | `CountdownTimer` |
| Chọn / hiển thị sao | `RatingStars` |
| Danh sách review | `FeedbackList` |
| Bảng dữ liệu admin | `AdminTable` |
| Biểu đồ thống kê | `StatsChart` |
| Upload ảnh | `ImageUploader` |
| Notification admin | `AlertBanner` |

**Không tạo component trùng chức năng với list trên.**

---

## 📦 SHARED TYPES

Tất cả interface/type dùng chung giữa FE và BE phải định nghĩa trong `packages/shared/types.ts`.

```typescript
// ✅ Đúng
import type { Booking, Villa } from '@villa/shared/types';

// ❌ Sai — không định nghĩa type lại trong từng app
interface Booking { ... } // trong apps/web/
```

---

## 🚫 NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

1. **Không hardcode** số điện thoại Zalo, API key, URL — phải dùng env variables
2. **Không hardcode hold time = 15** — phải lấy từ `villa.hold_minutes`
3. **Không tạo booking mà không check overlap** với booking confirmed/pending khác của cùng villa
4. **Không hiển thị feedback chưa verified** trên trang public
5. **Không cho phép submit feedback** khi chưa đủ 3 điều kiện
6. **Không skip ghi booking_history** khi thay đổi status booking
7. **Không skip ghi admin_log** khi admin thực hiện CRUD
8. **Không dùng `any` type** trong TypeScript
9. **Không để lộ stack trace** trong response lỗi trên production
10. **Không xoá booking** — chỉ set `status = 'cancelled'` (giữ lại để phân tích)

---

## ✅ CHECKLIST TRƯỚC KHI SUBMIT CODE

Trước khi hoàn thành một task, AI phải tự kiểm tra:

- [ ] Đã đọc `README.md`, `checklist.md`, `ARCHITECTURE.md` chưa?
- [ ] File tạo ra có đúng vị trí trong cấu trúc thư mục không?
- [ ] Có duplicate logic với code đã có không?
- [ ] Auth middleware đã được gắn đúng vào route chưa?
- [ ] DB query có qua Prisma không? Có dùng đúng Prisma type không?
- [ ] Admin action đã ghi `admin_log` chưa?
- [ ] Booking status change đã ghi `booking_history` chưa?
- [ ] Env variables được đọc từ `process.env` không? Không hardcode?
- [ ] Error response có message rõ ràng, không leak stack trace không?
- [ ] TypeScript có lỗi type nào không?

---

## 📝 KHI NHẬN YÊU CẦU MỚI

Khi được yêu cầu implement một feature mới, AI phải:

1. **Đọc lại** `README.md` để xác nhận feature có trong kiến trúc không
2. **Kiểm tra** `checklist.md` — feature này thuộc Phase nào, đã có task chưa
3. **Kiểm tra** `ARCHITECTURE.md` — API endpoint, DB schema, component nào liên quan
4. **Xác nhận** với người dùng nếu feature có vẻ ngoài scope thiết kế ban đầu
5. **Không tự ý thêm thư viện** — hỏi trước nếu cần package mới
6. Chỉ sau đó mới bắt đầu viết code

---

> **Tóm tắt ngắn gọn:** Đọc 3 file tài liệu → Hiểu context → Code đúng kiến trúc → Không duplicate → Không bỏ qua security.
> Bất kỳ code nào vi phạm rules này đều phải được refactor trước khi merge.