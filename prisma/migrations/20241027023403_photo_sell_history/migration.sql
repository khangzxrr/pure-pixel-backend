/*
  Warnings:

  - You are about to drop the column `photoSellId` on the `PhotoBuy` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `PhotoBuy` table. All the data in the column will be lost.
  - You are about to drop the column `colorGradingPhotoUrl` on the `PhotoSell` table. All the data in the column will be lost.
  - You are about to drop the column `colorGradingPhotoWatermarkUrl` on the `PhotoSell` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `PhotoSell` table. All the data in the column will be lost.
  - Added the required column `photoSellHistoryId` to the `PhotoBuy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PhotoBuy" DROP CONSTRAINT "PhotoBuy_photoSellId_fkey";

-- DropIndex
DROP INDEX "PhotoBuy_photoSellId_buyerId_size_key";

-- AlterTable
ALTER TABLE "PhotoBuy" DROP COLUMN "photoSellId",
DROP COLUMN "size",
ADD COLUMN     "photoSellHistoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhotoSell" DROP COLUMN "colorGradingPhotoUrl",
DROP COLUMN "colorGradingPhotoWatermarkUrl",
DROP COLUMN "price";

-- CreateTable
CREATE TABLE "Pricetag" (
    "id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoSellId" TEXT NOT NULL,

    CONSTRAINT "Pricetag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoSellHistory" (
    "id" TEXT NOT NULL,
    "originalPhotoSellId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoSellHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pricetag" ADD CONSTRAINT "Pricetag_photoSellId_fkey" FOREIGN KEY ("photoSellId") REFERENCES "PhotoSell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSellHistory" ADD CONSTRAINT "PhotoSellHistory_originalPhotoSellId_fkey" FOREIGN KEY ("originalPhotoSellId") REFERENCES "PhotoSell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoBuy" ADD CONSTRAINT "PhotoBuy_photoSellHistoryId_fkey" FOREIGN KEY ("photoSellHistoryId") REFERENCES "PhotoSellHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
