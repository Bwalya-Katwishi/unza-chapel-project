-- AlterTable
ALTER TABLE "Facility" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "Facility" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate any legacy placeholder paths into galleryUrls, then drop the old column
UPDATE "Facility"
SET "galleryUrls" = COALESCE("imagePlaceholders", ARRAY[]::TEXT[])
WHERE "imagePlaceholders" IS NOT NULL AND cardinality("imagePlaceholders") > 0;

ALTER TABLE "Facility" DROP COLUMN "imagePlaceholders";
