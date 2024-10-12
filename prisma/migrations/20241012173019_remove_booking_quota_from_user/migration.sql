/*
  Warnings:

  - You are about to drop the column `bookingPhotoQuotaUsage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bookingVideoQuotaUsage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingPhotoQuota` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingVideoQuota` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "bookingPhotoQuotaUsage",
DROP COLUMN "bookingVideoQuotaUsage",
DROP COLUMN "maxBookingPhotoQuota",
DROP COLUMN "maxBookingVideoQuota";
