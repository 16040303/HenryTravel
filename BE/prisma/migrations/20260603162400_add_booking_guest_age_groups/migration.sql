-- Add age-group guest counts while keeping guests_count as the canonical total.
ALTER TABLE "bookings"
  ADD COLUMN "adult_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "children_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "infant_count" INTEGER NOT NULL DEFAULT 0;

-- Existing bookings only stored a total, so treat the historical total as adults.
UPDATE "bookings"
SET "adult_count" = "guests_count",
    "children_count" = 0,
    "infant_count" = 0;
