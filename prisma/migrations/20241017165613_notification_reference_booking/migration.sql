/*
  Warnings:

  - You are about to drop the `PhotoshootReview` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `referenceId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceType` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationReferenceType" AS ENUM ('BOOKING', 'COMMENT', 'CHAT', 'UPGRADE_PACKAGE', 'PHOTO_SELL', 'PHOTO_BUY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DENIED', 'STARTED', 'ENDED', 'UPLOADED', 'PAID', 'SUCCESSED', 'FAILED');

-- DropForeignKey
ALTER TABLE "PhotoshootReview" DROP CONSTRAINT "PhotoshootReview_photoshootPackageId_fkey";

-- DropForeignKey
ALTER TABLE "PhotoshootReview" DROP CONSTRAINT "PhotoshootReview_userId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "referenceId" TEXT NOT NULL,
ADD COLUMN     "referenceType" "NotificationReferenceType" NOT NULL;

-- DropTable
DROP TABLE "PhotoshootReview";

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "photoshootPackageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "failedReason" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "star" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "photoshootPackageId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_userId_key" ON "Review"("bookingId", "userId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
