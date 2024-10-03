/*
  Warnings:

  - A unique constraint covering the columns `[watermark,quality,sharePhotoUrl,originalPhotoId]` on the table `PhotoSharing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PhotoSharing_watermark_quality_sharePhotoUrl_key";

-- CreateIndex
CREATE UNIQUE INDEX "PhotoSharing_watermark_quality_sharePhotoUrl_originalPhotoI_key" ON "PhotoSharing"("watermark", "quality", "sharePhotoUrl", "originalPhotoId");
