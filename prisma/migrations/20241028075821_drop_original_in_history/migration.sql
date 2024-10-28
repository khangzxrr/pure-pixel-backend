/*
  Warnings:

  - You are about to drop the column `photoshootPackageId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `originalPhotoshootPackageId` on the `PhotoshootPackageHistory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_photoshootPackageId_fkey";

-- DropForeignKey
ALTER TABLE "PhotoshootPackageHistory" DROP CONSTRAINT "PhotoshootPackageHistory_originalPhotoshootPackageId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "photoshootPackageId",
ADD COLUMN     "originalPhotoshootPackageId" TEXT;

-- AlterTable
ALTER TABLE "PhotoshootPackageHistory" DROP COLUMN "originalPhotoshootPackageId",
ADD COLUMN     "photoshootPackageId" TEXT;

-- AddForeignKey
ALTER TABLE "PhotoshootPackageHistory" ADD CONSTRAINT "PhotoshootPackageHistory_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_originalPhotoshootPackageId_fkey" FOREIGN KEY ("originalPhotoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
