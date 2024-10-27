/*
  Warnings:

  - You are about to drop the column `resolution` on the `PhotoBuy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[photoSellId,buyerId,size]` on the table `PhotoBuy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `size` to the `PhotoBuy` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PhotoBuy_photoSellId_buyerId_resolution_key";

-- AlterTable
ALTER TABLE "PhotoBuy" DROP COLUMN "resolution",
ADD COLUMN     "size" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PhotoBuy_photoSellId_buyerId_size_key" ON "PhotoBuy"("photoSellId", "buyerId", "size");
