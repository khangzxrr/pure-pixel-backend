/*
  Warnings:

  - You are about to drop the column `colorGradingPhotoUrl` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `colorGradingPhotoWatermarkUrl` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "colorGradingPhotoUrl",
DROP COLUMN "colorGradingPhotoWatermarkUrl";

-- AlterTable
ALTER TABLE "PhotoSell" ADD COLUMN     "colorGradingPhotoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "colorGradingPhotoWatermarkUrl" TEXT NOT NULL DEFAULT '';
