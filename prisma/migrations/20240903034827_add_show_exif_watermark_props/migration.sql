/*
  Warnings:

  - You are about to drop the column `cameraSetting` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `exif` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `watermarkPhotoUrl` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `watermarkThumbnailPhotoUrl` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "cameraSetting",
ADD COLUMN     "exif" JSONB NOT NULL,
ADD COLUMN     "showExif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watermark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watermarkPhotoUrl" TEXT NOT NULL,
ADD COLUMN     "watermarkThumbnailPhotoUrl" TEXT NOT NULL,
ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
