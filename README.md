# HenryTravel — Villa Booking System

HenryTravel là hệ thống đặt villa/homestay gồm **FE Vite React + TypeScript** và **BE Express + Prisma/PostgreSQL**. Hệ thống hỗ trợ booking hold, tra cứu booking, quản trị villa/booking/feedback, đa ngôn ngữ FE, Zalo fallback, media Cloudinary và admin audit log.

## Project structure

```txt
henrytravel/
├── BE/                         # Express API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma schema hiện tại
│   │   └── seed.ts
│   └── src/
│       ├── routes/              # Public/admin API routes
│       ├── services/            # Booking, settings, upload, email, logs
│       ├── middleware/          # Auth, rate limit, error handling
│       ├── jobs/                # Hold release + Cloudinary cleanup jobs
│       ├── lib/                 # Prisma client
│       └── utils/
├── FE/                         # Vite React + TypeScript frontend
│   └── src/
│       ├── components/          # Public/admin UI components
│       ├── i18n/                # FE translation dictionaries
│       ├── lib/api.ts           # API client and data mapping
│       └── types/index.ts       # FE types
├── rules/                      # Architecture, checklist, project plan/rules
├── DEPLOY_CHECKLIST.md
└── README.md
```

## Requirements

- Node.js 20+
- PostgreSQL database
- Cloudinary account for image/video upload
- Zalo/contact settings configured from admin settings or env fallback

## Environment files

Create env files from examples:

```bash
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
```

### Backend env

See [BE/.env.example](file:///c:/xampp/htdocs/henrytravel/BE/.env.example).

Important values:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_REFRESH_TOKEN_DAYS`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- Contact/settings fallbacks: `ZALO_PHONE`, `WHATSAPP_PHONE`, social links
- Email placeholders/config: `SENDGRID_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, SMTP fallback values

### Frontend env

See [FE/.env.example](file:///c:/xampp/htdocs/henrytravel/FE/.env.example).

Important values:

- `VITE_API_URL`
- `VITE_ZALO_PHONE` fallback only

## Local development

### Backend

```bash
cd BE
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Default API URL: `http://localhost:3001/api`.

### Frontend

```bash
cd FE
npm install
npm run dev
```

Default web URL: `http://localhost:3000`.

> Backend CORS must allow the frontend URL via `CLIENT_URL`.

## Build

### Backend

```bash
cd BE
npm run build
npm start
```

### Frontend

```bash
cd FE
npm run build
npm run preview
```

## Database workflow

Use Prisma for all schema changes. Current schema lives at [BE/prisma/schema.prisma](file:///c:/xampp/htdocs/henrytravel/BE/prisma/schema.prisma).

```bash
cd BE
npx prisma validate
npx prisma migrate dev
npx prisma generate
npm run seed
```

For production deploy, run migrations against the production database before starting the API.

## Current core flows to test

- Public villa list/detail loads from API.
- Public settings load from `/api/settings/public`.
- Villa availability includes booked, pending, and manually blocked dates.
- Booking creates `pending_hold`, booking code, guest token cookie, and Zalo links.
- Expired hold job cancels old `pending_hold` bookings and writes booking history.
- Admin login, refresh session, logout, and change password work.
- Admin villa CRUD, bulk status/delete, media upload/reorder/cover/delete work.
- Admin blocked dates work.
- Admin confirm/cancel/complete booking writes booking history and admin log.
- Admin CSV export works.
- Public feedback only shows verified feedback.
- Cloudinary upload validates media and cleanup job tracks orphan cleanup.

## Documentation

Project rules and architecture live in [rules](file:///c:/xampp/htdocs/henrytravel/rules). Read them before changing logic or database schema.

## Verification status

Recent local verification:

- `BE`: `npm run build` passed.
- `FE`: `npm run build` passed.

Production deploy, production security audit, and production end-to-end tests require separate verification.
