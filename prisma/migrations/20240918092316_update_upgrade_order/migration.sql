/*
  Warnings:

  - You are about to drop the column `bookingQuotaSize` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `quotaSize` on the `UpgradeOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UpgradeOrder" DROP COLUMN "bookingQuotaSize",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "quotaSize",
ADD COLUMN     "descriptions" TEXT[],
ADD COLUMN     "maxBookingPhotoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxBookingVideoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPackageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPhotoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minOrderMonth" INTEGER NOT NULL DEFAULT 0;
