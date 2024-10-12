/*
  Warnings:

  - You are about to drop the column `maxBookingPhotoQuota` on the `UpgradePackageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingVideoQuota` on the `UpgradePackageHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UpgradePackageHistory" DROP COLUMN "maxBookingPhotoQuota",
DROP COLUMN "maxBookingVideoQuota";
