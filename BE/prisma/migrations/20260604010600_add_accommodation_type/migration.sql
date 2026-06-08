-- Add accommodation type with safe default for existing rows.
CREATE TYPE "AccommodationType" AS ENUM ('villa', 'hotel_resort');

ALTER TABLE "villas"
ADD COLUMN "accommodation_type" "AccommodationType" NOT NULL DEFAULT 'villa';

CREATE INDEX "villas_accommodation_type_idx" ON "villas"("accommodation_type");
