# HenryTravel Deploy Checklist

Use this checklist before every production deploy.

## 1. Pre-deploy safety

- [ ] Confirm current branch/build source is the intended code version.
- [ ] Confirm no `.env` file is committed or uploaded publicly.
- [ ] Confirm production `DATABASE_URL` points to the correct database.
- [ ] Confirm `JWT_SECRET` is strong and unique for production.
- [ ] Confirm `CLIENT_URL` is the final frontend domain.
- [ ] Confirm `VITE_API_URL` is the final backend API URL with `/api` suffix.

## 2. Backend env

Set these on Render/Railway or equivalent:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
CLIENT_URL=https://your-frontend-domain.com
ZALO_PHONE=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Optional future email env:

```env
SENDGRID_API_KEY=
EMAIL_FROM=
ADMIN_EMAIL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## 3. Frontend env

Set these on Vercel/Netlify or equivalent:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_ZALO_PHONE=
```

## 4. Database migration

Run against production database:

```bash
cd BE
npm install
npx prisma generate
npx prisma migrate deploy
```

Seed only if this is a fresh environment:

```bash
npm run seed
```

> Do not run seed on an existing production DB unless intentionally resetting demo data.

## 5. Backend deploy

- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Start command: `npm start`
- [ ] Health check: open `https://backend-domain/api/settings/public`
- [ ] Confirm logs do not expose JWT, guest token, passwords, or API keys.
- [ ] Confirm CORS allows only the frontend domain.

## 6. Frontend deploy

- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Open frontend production URL.
- [ ] Confirm API calls use production `VITE_API_URL`.

## 7. Cloudinary

- [ ] Cloudinary credentials are set on backend only.
- [ ] Upload test image from admin villa form.
- [ ] Confirm uploaded image URL is public and loads via HTTPS.
- [ ] Confirm invalid file types are rejected.
- [ ] Confirm files above 5MB are rejected.

## 8. Smoke test after deploy

### Public user flow

- [ ] Home loads.
- [ ] Villa list loads from API.
- [ ] Villa detail loads images, facilities, availability, feedback.
- [ ] Booking form validates check-in/check-out and guest count.
- [ ] Submit booking creates `pending_hold`.
- [ ] Booking success shows booking code, countdown, and Zalo links.
- [ ] Booking lookup works with booking code + phone.

### Admin flow

- [ ] Admin login works.
- [ ] Dashboard loads stats.
- [ ] Villa CRUD works.
- [ ] Image upload works.
- [ ] Booking filters work.
- [ ] Confirm booking changes status and writes history.
- [ ] Cancel booking changes status and writes history.
- [ ] Complete booking only works for confirmed booking.
- [ ] Admin logs show recent actions.

### Background job

- [ ] Create short hold booking in test data.
- [ ] Wait for expiry.
- [ ] Confirm job changes status to `cancelled`.
- [ ] Confirm booking history has system auto-release entry.

## 9. Rollback notes

- Keep previous backend and frontend deployment versions available.
- If migration was applied, inspect whether rollback needs a reverse migration.
- Do not manually edit production DB except emergency documented fixes.
