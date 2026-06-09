# Hướng Dẫn Deploy Demo HenryTravel

Mô hình đã chốt:

| Phần | Nền tảng |
|---|---|
| Frontend | Vercel Free |
| Backend | Render Free |
| Database | Supabase Free Postgres |
| Media | Cloudinary |
| Email | SendGrid |
| Domain | Domain mặc định Vercel/Render trước |
| Seed data | Có, chỉ seed khi Supabase DB mới/fresh |

> [!IMPORTANT]
> Hướng dẫn này chỉ phục vụ deploy demo. Không sửa DB/schema/API/booking/media/Zalo/auth/payment logic.

---

## 0. Chuẩn bị trước khi deploy

### Tài khoản cần có

- GitHub chứa source code HenryTravel.
- Supabase account.
- Cloudinary account.
- SendGrid account.
- Render account.
- Vercel account.

### Kiểm tra code local trước

Chạy ở local để chắc code build được trước khi deploy:

```powershell
# Frontend
cd FE
npm run lint
npm run build
```

```powershell
# Backend
cd BE
npx prisma validate
npm run build
```

Nếu lệnh nào fail thì sửa trước khi deploy.

---

## 1. Tạo Supabase Free Postgres

### 1.1 Tạo project

1. Vào Supabase Dashboard.
2. Chọn **New project**.
3. Chọn organization.
4. Đặt tên ví dụ: `henrytravel-demo`.
5. Tạo database password mạnh và lưu lại.
6. Region chọn gần Việt Nam nhất nếu có, ví dụ Singapore.
7. Chờ project tạo xong.

### 1.2 Lấy Database URL

Vào:

```text
Project Settings → Database → Connection string
```

Chọn connection string phù hợp với Prisma.

Dạng thường gặp:

```env
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public
```

Nếu dùng pooler của Supabase, đảm bảo URL hoạt động với Prisma migrate.

> [!IMPORTANT]
> Không commit `DATABASE_URL` vào GitHub. Chỉ dán vào Render env.

---

## 2. Tạo Cloudinary

1. Vào Cloudinary Dashboard.
2. Lấy các thông tin:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

3. Chỉ set các biến này ở Render backend.
4. Không set Cloudinary secret ở Vercel/frontend.

---

## 3. Tạo SendGrid

### 3.1 Tạo API key

1. Vào SendGrid Dashboard.
2. Tạo API key mới.
3. Quyền tối thiểu: Mail Send.
4. Lưu lại API key.

```env
SENDGRID_API_KEY=
```

### 3.2 Verify sender

1. Vào **Sender Authentication**.
2. Verify single sender hoặc domain.
3. Email đã verify sẽ dùng cho:

```env
EMAIL_FROM="HenryTravel <verified-email@example.com>"
```

> [!WARNING]
> Nếu sender chưa verify, SendGrid có thể không gửi email được.

---

## 4. Deploy Backend lên Render Free

### 4.1 Tạo Web Service

1. Vào Render Dashboard.
2. Chọn **New +** → **Web Service**.
3. Connect GitHub repository `henrytravel`.
4. Chọn branch muốn deploy, ví dụ `main`.

### 4.2 Render settings

Set như sau:

| Setting | Value |
|---|---|
| Name | `henrytravel-api-demo` |
| Root Directory | `BE` |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

### 4.3 Backend environment variables

Trong Render → service → **Environment**, thêm:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="SUPABASE_DATABASE_URL"
JWT_SECRET="RANDOM_LONG_SECRET"
JWT_EXPIRES_IN="8h"
ADMIN_REFRESH_TOKEN_DAYS="30"
CLIENT_URL="https://temporary-vercel-domain.vercel.app"
PUBLIC_APP_URL="https://temporary-vercel-domain.vercel.app"

ZALO_PHONE=""
WHATSAPP_PHONE=""
WECHAT_ID=""
KAKAOTALK_ID=""
TIKTOK_URL=""
FACEBOOK_PERSONAL_URL=""
FACEBOOK_FANPAGE_URL=""
NAVER_BLOG_URL=""
INSTAGRAM_WORK_URL=""

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

SENDGRID_API_KEY=""
EMAIL_FROM="HenryTravel <verified-email@example.com>"
ADMIN_EMAIL="admin@example.com"
```

Lưu ý:

- `DATABASE_URL`: dán Supabase Postgres URL.
- `JWT_SECRET`: dùng chuỗi random dài, không dùng `change-me`.
- `CLIENT_URL`: ban đầu chưa có Vercel URL thì đặt tạm, sau khi deploy FE xong quay lại sửa.
- `PUBLIC_APP_URL`: giống FE URL.

### 4.4 Deploy lần đầu

1. Bấm **Deploy latest commit**.
2. Chờ build xong.
3. Copy backend URL dạng:

```text
https://henrytravel-api-demo.onrender.com
```

### 4.5 Health check backend

Mở URL:

```text
https://henrytravel-api-demo.onrender.com/api/settings/public
```

Nếu trả JSON là backend sống.

> [!WARNING]
> Render Free có cold start. Lần mở đầu có thể chậm.

---

## 5. Chạy migration Prisma lên Supabase

Có 2 cách. Khuyến nghị dùng local terminal vì dễ kiểm soát.

### 5.1 Tạo file `.env` backend local tạm thời

Trong máy local, tạo/cập nhật:

```text
BE/.env
```

Set ít nhất:

```env
DATABASE_URL="SUPABASE_DATABASE_URL"
JWT_SECRET="RANDOM_LONG_SECRET"
CLIENT_URL="https://temporary-vercel-domain.vercel.app"
```

> [!IMPORTANT]
> Không commit file `.env`.

### 5.2 Chạy migrate deploy

```powershell
cd BE
npx prisma generate
npx prisma migrate deploy
```

Nếu migrate thành công, schema đã lên Supabase.

### 5.3 Seed demo data

Chỉ chạy khi DB Supabase mới/fresh:

```powershell
npm run seed
```

> [!CAUTION]
> Không chạy seed nếu DB đã có dữ liệu thật hoặc dữ liệu demo đã chỉnh thủ công.

---

## 6. Deploy Frontend lên Vercel Free

### 6.1 Tạo project Vercel

1. Vào Vercel Dashboard.
2. Chọn **Add New** → **Project**.
3. Import GitHub repository `henrytravel`.

### 6.2 Vercel settings

Set như sau:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `FE` |
| Build Command | `npm install && npm run build` |
| Output Directory | `dist` |

### 6.3 Frontend environment variables

Trong Vercel → Project → Settings → Environment Variables:

```env
VITE_API_URL="https://henrytravel-api-demo.onrender.com/api"
VITE_ZALO_PHONE=""
```

Thay backend URL bằng Render URL thật.

### 6.4 Deploy frontend

1. Bấm **Deploy**.
2. Chờ build xong.
3. Copy FE URL dạng:

```text
https://henrytravel-demo.vercel.app
```

---

## 7. Cập nhật CORS backend sau khi có Vercel URL

Quay lại Render → backend service → Environment.

Sửa:

```env
CLIENT_URL="https://henrytravel-demo.vercel.app"
PUBLIC_APP_URL="https://henrytravel-demo.vercel.app"
```

Sau đó redeploy backend:

```text
Render → Manual Deploy → Deploy latest commit
```

Kiểm tra lại backend:

```text
https://henrytravel-api-demo.onrender.com/api/settings/public
```

---

## 8. Smoke test demo

### 8.1 Public pages

Mở Vercel URL và test:

- `/`
- `/all`
- `/villas`
- `/hotel_resort`
- `/lookup`
- Detail villa/hotel nếu có data.

Checklist:

- Trang load không trắng.
- Villa list gọi đúng Render API.
- Ảnh/media load qua Cloudinary hoặc URL đã seed.
- Navbar/contact modal mở được.
- Không lỗi CORS trong browser console.

### 8.2 Booking flow

Test:

1. Vào detail villa.
2. Chọn ngày hợp lệ.
3. Nhập thông tin khách.
4. Submit booking.
5. Kiểm tra booking success:
   - Có booking code.
   - Có countdown hold.
   - Có Zalo links.
6. Vào lookup và tra cứu bằng booking code + phone.

### 8.3 Admin flow

Mở:

```text
https://henrytravel-demo.vercel.app/admin/login
```

Test:

- Admin login.
- Dashboard load.
- Villa list load.
- Tạo/sửa villa nếu cần demo.
- Upload ảnh test lên Cloudinary.
- Booking confirm/cancel/complete.
- Kiểm tra booking history/admin log.

### 8.4 Email SendGrid

Test flow tạo booking/admin confirm nếu email đã tích hợp trong backend hiện tại.

Kiểm tra:

- Email admin nhận được.
- Email khách nhận được.
- Nếu không thấy, kiểm tra spam và SendGrid Activity.

### 8.5 Background job hold expiry

Test nếu có thể tạo booking hold ngắn:

1. Tạo booking `pending_hold`.
2. Chờ hết hạn.
3. Kiểm tra status thành `cancelled`.
4. Kiểm tra booking history có entry system auto-release.

---

## 9. Checklist bảo mật trước khi gửi demo link

- [ ] Không commit `.env`.
- [ ] Render env không để `JWT_SECRET=change-me`.
- [ ] `CLIENT_URL` đúng Vercel URL, không wildcard production.
- [ ] Cloudinary secret chỉ nằm ở Render.
- [ ] SendGrid API key chỉ nằm ở Render.
- [ ] Supabase password không lộ trong frontend.
- [ ] Browser console không có lỗi CORS/API.
- [ ] Render logs không in JWT, guest token, password, API key.

---

## 10. Troubleshooting nhanh

### FE gọi API lỗi CORS

Kiểm tra Render env:

```env
CLIENT_URL="https://henrytravel-demo.vercel.app"
```

Redeploy backend sau khi sửa.

### FE vẫn gọi localhost

Kiểm tra Vercel env:

```env
VITE_API_URL="https://henrytravel-api-demo.onrender.com/api"
```

Redeploy frontend sau khi sửa.

### Backend build fail Prisma

Kiểm tra Render build command:

```text
npm install && npx prisma generate && npm run build
```

Kiểm tra `DATABASE_URL` có đúng format Postgres không.

### Migration fail

- Kiểm tra Supabase DB URL/password.
- Chạy local:

```powershell
cd BE
npx prisma validate
npx prisma migrate deploy
```

### Upload ảnh fail

Kiểm tra Render env:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Email không gửi

Kiểm tra:

- `SENDGRID_API_KEY` đúng.
- `EMAIL_FROM` đã verify trong SendGrid.
- `ADMIN_EMAIL` đúng.
- SendGrid Activity có event không.

### Render backend ngủ

Render Free sẽ ngủ khi không có traffic.

Cách xử lý demo:

- Mở backend health endpoint trước khi demo vài phút.
- Chờ service wake up.

---

## 11. Rollback demo

### Frontend Vercel

Vercel → Deployments → chọn bản trước → Promote/Rollback.

### Backend Render

Render → Events/Deploys → redeploy commit trước nếu cần.

### Database Supabase

Nếu migration đã chạy và gây lỗi:

- Với demo fresh: có thể tạo DB mới và migrate lại.
- Với DB có data: cần restore backup hoặc viết reverse migration có kiểm soát.

> [!CAUTION]
> Không sửa DB production/demo trực tiếp nếu không ghi chú rõ thao tác.

---

## 12. Thứ tự thao tác khuyến nghị

1. Tạo Supabase.
2. Tạo Cloudinary.
3. Tạo SendGrid + verify sender.
4. Deploy backend Render tạm với `CLIENT_URL` placeholder.
5. Chạy Prisma migrate deploy vào Supabase.
6. Seed demo data nếu DB fresh.
7. Deploy frontend Vercel với Render API URL.
8. Copy Vercel URL cập nhật lại `CLIENT_URL` và `PUBLIC_APP_URL` ở Render.
9. Redeploy backend.
10. Smoke test public/admin/booking/upload/email.

---

## 13. Giá trị env mẫu cuối cùng

### Render Backend

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://...supabase...?schema=public"
JWT_SECRET="generate-a-long-random-secret"
JWT_EXPIRES_IN="8h"
ADMIN_REFRESH_TOKEN_DAYS="30"
CLIENT_URL="https://henrytravel-demo.vercel.app"
PUBLIC_APP_URL="https://henrytravel-demo.vercel.app"

ZALO_PHONE=""
WHATSAPP_PHONE=""
WECHAT_ID=""
KAKAOTALK_ID=""
TIKTOK_URL=""
FACEBOOK_PERSONAL_URL=""
FACEBOOK_FANPAGE_URL=""
NAVER_BLOG_URL=""
INSTAGRAM_WORK_URL=""

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

SENDGRID_API_KEY="SG.xxx"
EMAIL_FROM="HenryTravel <verified-email@example.com>"
ADMIN_EMAIL="admin@example.com"
```

### Vercel Frontend

```env
VITE_API_URL="https://henrytravel-api-demo.onrender.com/api"
VITE_ZALO_PHONE=""
```
