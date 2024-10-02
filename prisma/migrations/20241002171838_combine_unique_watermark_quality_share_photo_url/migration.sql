/*
  Warnings:

  - A unique constraint covering the columns `[watermark,quality,sharePhotoUrl]` on the table `PhotoSharing` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PhotoSharing_watermark_quality_sharePhotoUrl_key" ON "PhotoSharing"("watermark", "quality", "sharePhotoUrl");
