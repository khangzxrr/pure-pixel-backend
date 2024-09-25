/*
  Warnings:

  - You are about to drop the column `maxBookingPhotoCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingVideoCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxPhotoCount` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "maxBookingPhotoCount",
DROP COLUMN "maxBookingVideoCount",
DROP COLUMN "maxPhotoCount",
ADD COLUMN     "maxBookingPhotoQuota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxBookingVideoQuota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPhotoQuota" INTEGER NOT NULL DEFAULT 0;
