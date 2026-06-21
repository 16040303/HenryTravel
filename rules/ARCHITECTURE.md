# 🏛️ ARCHITECTURE.md — HenryTravel Current Architecture

> Tài liệu này mô tả hệ thống hiện tại đã đối chiếu với code. Nguồn tham chiếu chính: `BE/prisma/schema.prisma`, `BE/src/routes`, `FE/src/lib/api.ts`, `FE/src/types/index.ts`.

---

## 1. Tech Stack & Paths

| Layer | Hiện tại |
|---|---|
| Frontend | Vite React + TypeScript |
| Backend | Node.js Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Media | Cloudinary |
| FE i18n | `FE/src/i18n` |
| FE API client | `FE/src/lib/api.ts` |
| FE types | `FE/src/types/index.ts` |
| Prisma schema | `BE/prisma/schema.prisma` |
| BE routes | `BE/src/routes` |

---

## 2. Runtime Structure

```txt
BE/src/
├── index.ts                 # Express bootstrap, CORS, jobs, routes
├── routes/                  # Public + admin routers
├── services/                # Booking, upload, email, settings, admin logs
├── middleware/              # Auth, rate limit, error handler
├── jobs/                    # Release hold, Cloudinary cleanup
├── lib/prisma.ts            # Prisma client
└── utils/                   # Errors, validators

FE/src/
├── App.tsx
├── components/              # Public views + admin components
├── contexts/LanguageContext.tsx
├── i18n/                    # vi/en/ko/zh dictionaries
├── lib/api.ts               # API calls + backend/frontend mapping
├── hooks/                   # Queries/mutations/countdown
└── types/index.ts
```

---

## 3. Database Schema Summary

Current schema is in [schema.prisma](file:///c:/xampp/htdocs/henrytravel/BE/prisma/schema.prisma).

### Enums

- `UserRole`: `user`, `admin`
- `VillaStatus`: `available`, `maintenance`, `hidden`
- `PriceType`: `fixed`, `contact`
- `BookingStatus`: `pending_hold`, `confirmed`, `cancelled`, `completed`
- `BookingSource`: `web`, `admin_manual`
- `DepositStatus`: `none`, `pending`, `paid`, `refunded`
- `MediaType`: `image`, `video`
- `AccommodationType`: `villa`, `hotel_resort`

### Main Models

| Model | Purpose |
|---|---|
| `User` | Admin/user/guest records, password for admin, refresh token relation |
| `AdminRefreshToken` | Admin refresh sessions, hashed token, expiry/revocation |
| `Villa` | Accommodation record with multilingual fields, type, price range, facilities |
| `VillaMedia` | Cloudinary image/video media; replaces the legacy JSON image-field approach |
| `VillaBlockedDate` | Admin-managed unavailable date ranges |
| `Booking` | Guest booking hold/confirmed/cancelled/completed lifecycle |
| `ZaloMessage` | Stored Zalo mobile/web/fallback links per booking |
| `Feedback` | Verified reviews tied one-to-one to booking |
| `AdminLog` | Admin audit trail |
| `BookingHistory` | Booking status transition history |
| `BookingAttempt` | Booking rate limit tracking |
| `SystemSetting` | DB-first public/admin settings |
| `CloudinaryCleanupJob` | Deferred cleanup of deleted Cloudinary resources |

### Important Current Field Notes

- `Villa` uses `media: VillaMedia[]`; do not document new logic as a legacy JSON image field.
- `Villa` supports `nameEn`, `locationEn`, `descriptionEn`, `descriptionKo`.
- `Villa` supports `priceMax` and `accommodationType`.
- `Booking` supports `adultCount`, `childrenCount`, `infantCount` in addition to `guestsCount`.
- `Booking.guestToken` is used for guest lookup/cookie flow; do not log or expose unnecessarily.
- `Booking.holdExpireAt` drives auto-release of `pending_hold` records.

---

## 4. API Routes

Base URL defaults to `/api`.

### Public Routes

Registered in [BE/src/routes/index.ts](file:///c:/xampp/htdocs/henrytravel/BE/src/routes/index.ts).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/villas` | Public villa list/filter |
| GET | `/api/villas/:id` | Villa detail, includes media/data mapping |
| GET | `/api/villas/:id/availability` | Availability with booked/pending/blocked states |
| GET | `/api/villas/:id/feedbacks` | Verified public feedback only |
| POST | `/api/bookings` | Create pending hold booking |
| GET | `/api/bookings/check` | Lookup by booking code + phone |
| POST | `/api/feedbacks` | Submit feedback after validation |
| GET | `/api/settings/public` | Public contact/social/common policy settings |

### Admin Routes

Registered in [BE/src/routes/admin/index.ts](file:///c:/xampp/htdocs/henrytravel/BE/src/routes/admin/index.ts). All admin route groups except `/auth` are protected by `adminAuthMiddleware`.

| Method/Group | Path | Purpose |
|---|---|---|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/refresh` | Refresh admin JWT from cookie/session |
| POST | `/api/admin/auth/logout` | Logout/revoke session |
| PUT | `/api/admin/auth/change-password` | Change admin password |
| GET/POST/PUT/DELETE | `/api/admin/villas` | Villa CRUD, bulk actions |
| GET/POST/DELETE | `/api/admin/blocked-dates` | Manual unavailable date ranges |
| GET/PUT | `/api/admin/bookings` | Booking list/export/actions/history |
| GET/PUT | `/api/admin/feedbacks` | Feedback admin list/toggle |
| GET | `/api/admin/logs` | Admin audit logs |
| GET/PUT | `/api/admin/settings` | Contact/social/hold/common policy settings |
| POST | `/api/admin/media/upload` | Upload image/video to Cloudinary |
| GET/POST/PUT/DELETE | `/api/admin/villas/:villaId/media` | Attach/reorder/cover/delete villa media |
| GET | `/api/admin/stats` | Dashboard stats |

---

## 5. Core Flows

### Booking Flow

1. `POST /api/bookings` validates date range, guest counts, villa state, overlap, blocked dates, and rate limit.
2. Creates booking with `status = pending_hold`.
3. Generates `bookingCode` and `guestToken`.
4. Calculates `holdExpireAt` from current hold setting/villa behavior implemented in service.
5. Builds three Zalo links and stores `zalo_messages`.
6. Returns booking, guest token, hold minutes, and Zalo links.
7. Background job releases expired holds and writes `booking_history`.

### Admin Booking Flow

- Confirm/cancel/complete endpoints update booking status.
- Each status change writes `booking_history`.
- Admin actions write `admin_logs`.
- CSV export is available from admin bookings.

### Feedback Flow

- Public submit uses booking code + phone.
- Backend validates booking status, checkout date, and duplicate feedback.
- Public villa feedback returns only verified feedback.
- Admin can toggle feedback visibility.

### Media Flow

1. FE sends files to `/api/admin/media/upload`.
2. BE validates upload and sends to Cloudinary.
3. Uploaded media metadata is attached to a villa through `/api/admin/villas/:villaId/media`.
4. Media is stored in `villa_media`.
5. Deleted media can create `cloudinary_cleanup_jobs` for deferred cleanup.

---

## 6. Frontend Architecture

### Views / Components

- `HomeView`: search and discovery.
- `ListingView`: villa list/filter display.
- `DetailView`: villa detail, gallery, booking, feedback.
- `LookupView`: booking lookup.
- `PolicyView`: public policy page.
- `AdminConsoleView`: admin shell.
- Admin components under `FE/src/components/admin`.
- Common components under `FE/src/components/common`.

### FE Data Layer

- `FE/src/lib/api.ts` owns API calls, admin token handling, refresh flow, and backend-to-frontend mapping.
- `FE/src/types/index.ts` owns FE-side interfaces.
- `FE/src/hooks/queries.ts` and `FE/src/hooks/mutations.ts` provide query/mutation integration.

### i18n

- Translation dictionaries exist in `FE/src/i18n` for `vi`, `en`, `ko`, and `zh`.
- `LanguageContext` provides language state and translation access.
- Full hardcoded-string audit still requires verification.

---

## 7. Security / Constraints

- Admin routes must remain behind `adminAuthMiddleware`.
- DB access should go through Prisma.
- Booking creation must keep rate limit and overlap checks.
- Booking status changes must keep `booking_history`.
- Admin write actions must keep `admin_logs`.
- Guest token/JWT/password must not be logged.
- Cloudinary credentials and JWT secrets must stay in env files.

---

## 8. Verification Status

Verified locally in this documentation refresh:

- Current Prisma schema reviewed.
- Current BE routes reviewed.
- Current FE API client reviewed.
- Current FE types reviewed.
- Recent `npm run build` passed for both BE and FE.

Requires separate verification:

- Production deploy state.
- Production email delivery.
- Full security audit.
- Full responsive/device matrix testing.
- Production end-to-end booking/payment/email workflows.
