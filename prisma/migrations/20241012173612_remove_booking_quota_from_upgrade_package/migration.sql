/*
  Warnings:

  - You are about to drop the column `maxBookingPhotoQuota` on the `UpgradePackage` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingVideoQuota` on the `UpgradePackage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UpgradePackage" DROP COLUMN "maxBookingPhotoQuota",
DROP COLUMN "maxBookingVideoQuota";