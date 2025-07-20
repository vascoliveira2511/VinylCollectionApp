-- AlterTable
ALTER TABLE "Vinyl" ADD COLUMN "catalogNumber" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "condition" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "country" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "description" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "format" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "label" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "purchaseDate" DATETIME;
ALTER TABLE "Vinyl" ADD COLUMN "purchaseLocation" TEXT;
ALTER TABLE "Vinyl" ADD COLUMN "purchasePrice" REAL;
ALTER TABLE "Vinyl" ADD COLUMN "rating" INTEGER;
ALTER TABLE "Vinyl" ADD COLUMN "trackList" TEXT;
