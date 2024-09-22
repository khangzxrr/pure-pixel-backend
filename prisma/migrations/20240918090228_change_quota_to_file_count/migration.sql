/*
  Warnings:

  - You are about to drop the column `bookingQuotaSize` on the `UpgradePackage` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `UpgradePackage` table. All the data in the column will be lost.
  - You are about to drop the column `quotaSize` on the `UpgradePackage` table. All the data in the column will be lost.
  - You are about to drop the column `diskQuota` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `diskUsage` on the `User` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `Photo` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_categoryId_fkey";

-- AlterTable
ALTER TABLE "Photo" ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UpgradePackage" DROP COLUMN "bookingQuotaSize",
DROP COLUMN "description",
DROP COLUMN "quotaSize",
ADD COLUMN     "descriptions" TEXT[],
ADD COLUMN     "maxBookingPhotoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxBookingVideoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPackageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPhotoCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "diskQuota",
DROP COLUMN "diskUsage",
ADD COLUMN     "maxBookingPhotoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxBookingVideoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPackageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPhotoCount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
