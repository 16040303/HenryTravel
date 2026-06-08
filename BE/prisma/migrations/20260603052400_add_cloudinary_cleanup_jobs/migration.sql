-- Cloudinary cleanup queue for safe deferred asset deletion.
-- Do not destroy Cloudinary assets during villa image updates; enqueue them first.

CREATE TABLE IF NOT EXISTS "cloudinary_cleanup_jobs" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "villa_id" TEXT,
    "error" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloudinary_cleanup_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cloudinary_cleanup_jobs_status_scheduled_at_idx"
ON "cloudinary_cleanup_jobs"("status", "scheduled_at");

CREATE INDEX IF NOT EXISTS "cloudinary_cleanup_jobs_public_id_idx"
ON "cloudinary_cleanup_jobs"("public_id");

CREATE UNIQUE INDEX IF NOT EXISTS "cloudinary_cleanup_jobs_public_id_url_status_key"
ON "cloudinary_cleanup_jobs"("public_id", "url", "status");
