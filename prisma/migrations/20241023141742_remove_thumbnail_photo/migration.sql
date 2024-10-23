/*
  Warnings:

  - You are about to drop the column `thumbnailPhotoUrl` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `watermarkThumbnailPhotoUrl` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "thumbnailPhotoUrl",
DROP COLUMN "watermarkThumbnailPhotoUrl";
