-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "public"."VillaStatus" AS ENUM ('available', 'maintenance', 'hidden');

-- CreateEnum
CREATE TYPE "public"."PriceType" AS ENUM ('fixed', 'contact');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('pending_hold', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."BookingSource" AS ENUM ('web', 'admin_manual');

-- CreateEnum
CREATE TYPE "public"."DepositStatus" AS ENUM ('none', 'pending', 'paid', 'refunded');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "guest_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."villas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."VillaStatus" NOT NULL DEFAULT 'available',
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "price_type" "public"."PriceType" NOT NULL DEFAULT 'fixed',
    "facilities" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "hold_minutes" INTEGER NOT NULL DEFAULT 15,
    "deposit_required" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" DECIMAL(65,30),
    "max_guests" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" TEXT NOT NULL,
    "booking_code" TEXT NOT NULL,
    "user_id" TEXT,
    "villa_id" TEXT NOT NULL,
    "guest_name" TEXT,
    "guest_phone" TEXT,
    "guest_email" TEXT,
    "guest_token" TEXT,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3) NOT NULL,
    "guests_count" INTEGER NOT NULL,
    "rooms_count" INTEGER NOT NULL DEFAULT 1,
    "special_request" TEXT,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'pending_hold',
    "source" "public"."BookingSource" NOT NULL DEFAULT 'web',
    "hold_expire_at" TIMESTAMP(3),
    "deposit_status" "public"."DepositStatus" NOT NULL DEFAULT 'none',
    "deposit_method" TEXT,
    "deposit_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zalo_messages" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "message_url_mobile" TEXT NOT NULL,
    "message_url_web" TEXT NOT NULL,
    "message_url_fallback" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zalo_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedbacks" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "villa_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_history" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changed_by" TEXT,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_attempts" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "villa_id" TEXT NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "public"."bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_villa_id_idx" ON "public"."bookings"("villa_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "public"."bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_check_in_idx" ON "public"."bookings"("check_in");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "public"."bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_booking_code_idx" ON "public"."bookings"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_booking_id_key" ON "public"."feedbacks"("booking_id");

-- CreateIndex
CREATE INDEX "feedbacks_villa_id_idx" ON "public"."feedbacks"("villa_id");

-- CreateIndex
CREATE INDEX "booking_attempts_ip_address_attempted_at_idx" ON "public"."booking_attempts"("ip_address", "attempted_at");

-- CreateIndex
CREATE INDEX "booking_attempts_phone_attempted_at_idx" ON "public"."booking_attempts"("phone", "attempted_at");

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_villa_id_fkey" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zalo_messages" ADD CONSTRAINT "zalo_messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedbacks" ADD CONSTRAINT "feedbacks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedbacks" ADD CONSTRAINT "feedbacks_villa_id_fkey" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_history" ADD CONSTRAINT "booking_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

