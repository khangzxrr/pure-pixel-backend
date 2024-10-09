/*
  Warnings:

  - A unique constraint covering the columns `[photoSellId,buyerId,resolution]` on the table `PhotoBuy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resolution` to the `PhotoBuy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resolutionUrl` to the `PhotoBuy` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PhotoBuy_photoSellId_buyerId_key";

-- AlterTable
ALTER TABLE "PhotoBuy" ADD COLUMN     "resolution" TEXT NOT NULL,
ADD COLUMN     "resolutionUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PhotoBuy_photoSellId_buyerId_resolution_key" ON "PhotoBuy"("photoSellId", "buyerId", "resolution");
