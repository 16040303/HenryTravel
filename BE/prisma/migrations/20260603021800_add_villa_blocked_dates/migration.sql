-- CreateTable
CREATE TABLE "public"."villa_blocked_dates" (
    "id" TEXT NOT NULL,
    "villa_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villa_blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "villa_blocked_dates_villa_id_idx" ON "public"."villa_blocked_dates"("villa_id");

-- CreateIndex
CREATE INDEX "villa_blocked_dates_start_date_idx" ON "public"."villa_blocked_dates"("start_date");

-- CreateIndex
CREATE INDEX "villa_blocked_dates_end_date_idx" ON "public"."villa_blocked_dates"("end_date");

-- CreateIndex
CREATE INDEX "villa_blocked_dates_villa_id_start_date_end_date_idx" ON "public"."villa_blocked_dates"("villa_id", "start_date", "end_date");

-- AddForeignKey
ALTER TABLE "public"."villa_blocked_dates" ADD CONSTRAINT "villa_blocked_dates_villa_id_fkey" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."villa_blocked_dates" ADD CONSTRAINT "villa_blocked_dates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
