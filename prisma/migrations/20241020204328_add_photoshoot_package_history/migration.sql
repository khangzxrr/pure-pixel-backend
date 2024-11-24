/*
  Warnings:

  - Added the required column `photoshootPackageHistoryId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_photoshootPackageId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "photoshootPackageHistoryId" TEXT NOT NULL,
ALTER COLUMN "photoshootPackageId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PhotoshootPackageHistory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "originalPhotoshootPackageId" TEXT NOT NULL,

    CONSTRAINT "PhotoshootPackageHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoshootPackageHistory" ADD CONSTRAINT "PhotoshootPackageHistory_originalPhotoshootPackageId_fkey" FOREIGN KEY ("originalPhotoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_photoshootPackageHistoryId_fkey" FOREIGN KEY ("photoshootPackageHistoryId") REFERENCES "PhotoshootPackageHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
