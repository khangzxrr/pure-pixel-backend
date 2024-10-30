/*
  Warnings:

  - You are about to drop the column `originalPhotoshootPackageId` on the `Booking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_originalPhotoshootPackageId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "originalPhotoshootPackageId",
ADD COLUMN     "photoshootPackageId" TEXT;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
