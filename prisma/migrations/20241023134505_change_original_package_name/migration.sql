/*
  Warnings:

  - You are about to drop the column `photoshootPackageId` on the `Booking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_photoshootPackageId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "photoshootPackageId",
ADD COLUMN     "originalPhotoshootPackageId" TEXT;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_originalPhotoshootPackageId_fkey" FOREIGN KEY ("originalPhotoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
