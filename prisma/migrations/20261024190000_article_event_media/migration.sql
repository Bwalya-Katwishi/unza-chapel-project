-- AlterTable
ALTER TABLE "Article" ADD COLUMN "byline" TEXT;
ALTER TABLE "Article" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "Article" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Article" ADD COLUMN "photoCaption" TEXT;

-- AlterTable
ALTER TABLE "CommunityEvent" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "CommunityEvent" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
