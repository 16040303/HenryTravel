-- Add media enum/table, migrate existing villa image URLs, then remove legacy images column.
DO $$ BEGIN
  CREATE TYPE "MediaType" AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "villa_media" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "villa_id" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "secure_url" TEXT,
  "public_id" TEXT,
  "thumbnail_url" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "duration" DOUBLE PRECISION,
  "format" TEXT,
  "bytes" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_cover" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "villa_media_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "villa_media"
    ADD CONSTRAINT "villa_media_villa_id_fkey"
    FOREIGN KEY ("villa_id") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "villa_media_villa_id_idx" ON "villa_media"("villa_id");
CREATE INDEX IF NOT EXISTS "villa_media_villa_id_sort_order_idx" ON "villa_media"("villa_id", "sort_order");
CREATE INDEX IF NOT EXISTS "villa_media_villa_id_is_cover_idx" ON "villa_media"("villa_id", "is_cover");

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cloudinary_cleanup_jobs' AND column_name = 'resource_type'
  ) THEN
    -- already exists
  ELSE
    ALTER TABLE "cloudinary_cleanup_jobs" ADD COLUMN "resource_type" TEXT NOT NULL DEFAULT 'image';
  END IF;
END $$;

DROP INDEX IF EXISTS "cloudinary_cleanup_jobs_public_id_url_status_key";
CREATE UNIQUE INDEX IF NOT EXISTS "cloudinary_cleanup_jobs_public_id_url_status_resource_type_key"
  ON "cloudinary_cleanup_jobs"("public_id", "url", "status", "resource_type");

INSERT INTO "villa_media" (
  "villa_id", "type", "url", "sort_order", "is_cover", "created_at", "updated_at"
)
SELECT
  v."id",
  'image'::"MediaType",
  image_url,
  ordinality::int - 1,
  ordinality = 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "villas" v
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN jsonb_typeof(v."images"::jsonb) = 'array' THEN v."images"::jsonb
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS migrated(image_url, ordinality)
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'villas' AND column_name = 'images'
)
AND image_url IS NOT NULL
AND trim(image_url) <> '';

ALTER TABLE "villas" DROP COLUMN IF EXISTS "images";
