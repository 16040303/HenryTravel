-- Add nullable Chinese description for existing villas without affecting old records.
ALTER TABLE "villas" ADD COLUMN IF NOT EXISTS "description_zh" TEXT;

