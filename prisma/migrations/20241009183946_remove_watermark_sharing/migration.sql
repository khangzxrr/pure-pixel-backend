/*
  Warnings:

  - You are about to drop the column `watermark` on the `PhotoSharing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[quality,sharePhotoUrl,originalPhotoId]` on the table `PhotoSharing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PhotoSharing_watermark_quality_sharePhotoUrl_originalPhotoI_key";

-- AlterTable
ALTER TABLE "PhotoSharing" DROP COLUMN "watermark";

-- CreateIndex
CREATE UNIQUE INDEX "PhotoSharing_quality_sharePhotoUrl_originalPhotoId_key" ON "PhotoSharing"("quality", "sharePhotoUrl", "originalPhotoId");
