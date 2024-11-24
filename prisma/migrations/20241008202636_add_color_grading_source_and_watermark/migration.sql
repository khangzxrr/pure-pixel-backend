/*
  Warnings:

  - You are about to drop the column `colorGrading` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "colorGrading",
ADD COLUMN     "colorGradingPhotoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "colorGradingPhotoWatermarkUrl" TEXT NOT NULL DEFAULT '';
