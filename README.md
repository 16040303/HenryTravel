# HenryTravel — Villa Booking System

HenryTravel là hệ thống đặt villa/homestay gồm frontend Vite React và backend Node.js Express, có booking hold, quản trị villa/booking/feedback, Zalo fallback, Cloudinary upload và Prisma/PostgreSQL.

## Project structure

```txt
henrytravel/
├── BE/                 # Express API + Prisma
│   ├── prisma/         # schema, migrations, seed
│   └── src/            # routes, services, middleware, jobs
├── FE/                 # Vite React frontend
│   └── src/            # app, components, api client
├── rules/              # architecture, checklist, project rules
└── DEPLOY_CHECKLIST.md
```

## Requirements

- Node.js 20+
- PostgreSQL database, e.g. Supabase
- Cloudinary account for image upload
- Zalo phone configured via admin settings or env fallback

## Environment files

Create env files from examples:

```bash
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
```

### Backend required env

See [BE/.env.example](file:///c:/xampp/htdocs/henrytravel/BE/.env.example).

Important values:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend required env

See [FE/.env.example](file:///c:/xampp/htdocs/henrytravel/FE/.env.example).

Important values:

- `VITE_API_URL`
- `VITE_ZALO_PHONE`

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

> Note: backend CORS must allow the frontend URL via `CLIENT_URL`.

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

Use Prisma for all schema changes.

```bash
cd BE
npx prisma validate
npx prisma migrate dev
npx prisma generate
npm run seed
```

For production deploy, run migrations against the production database before starting the API.

## Core flows to test

- Public villa list/detail loads from API.
- Booking creates `pending_hold`, booking code, guest token cookie, and Zalo links.
- Expired hold job cancels old `pending_hold` bookings.
- Admin login works.
- Admin confirm/cancel/complete booking writes booking history and admin log.
- Public feedback only shows verified feedback.
- Admin upload validates image type/size and uploads to Cloudinary.

## Deploy

Follow [DEPLOY_CHECKLIST.md](file:///c:/xampp/htdocs/henrytravel/DEPLOY_CHECKLIST.md).

Recommended targets:

- Backend: Render/Railway
- Frontend: Vercel/Netlify
- Database: Supabase PostgreSQL
- Images: Cloudinary

## Documentation

Project rules and architecture live in [rules](file:///c:/xampp/htdocs/henrytravel/rules). Read them before changing logic or database schema.
