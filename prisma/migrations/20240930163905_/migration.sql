/*
  Warnings:

  - You are about to drop the column `descriptions` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingPhotoQuota` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingVideoQuota` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `maxPackageCount` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `maxPhotoQuota` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `minOrderMonth` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `originalUpgradePackageId` on the `UpgradeOrder` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `UpgradeOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[upgradePackageHistoryId]` on the table `UpgradeOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `upgradePackageHistoryId` to the `UpgradeOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_upgradeOrderId_fkey";

-- DropForeignKey
ALTER TABLE "UpgradeOrder" DROP CONSTRAINT "UpgradeOrder_originalUpgradePackageId_fkey";

-- AlterTable
ALTER TABLE "UpgradeOrder" DROP COLUMN "descriptions",
DROP COLUMN "maxBookingPhotoQuota",
DROP COLUMN "maxBookingVideoQuota",
DROP COLUMN "maxPackageCount",
DROP COLUMN "maxPhotoQuota",
DROP COLUMN "minOrderMonth",
DROP COLUMN "name",
DROP COLUMN "originalUpgradePackageId",
DROP COLUMN "price",
ADD COLUMN     "upgradePackageHistoryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UpgradePackageHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minOrderMonth" INTEGER NOT NULL DEFAULT 0,
    "maxPhotoQuota" BIGINT NOT NULL DEFAULT 0,
    "maxPackageCount" BIGINT NOT NULL DEFAULT 0,
    "maxBookingPhotoQuota" BIGINT NOT NULL DEFAULT 0,
    "maxBookingVideoQuota" BIGINT NOT NULL DEFAULT 0,
    "descriptions" TEXT[],
    "originalUpgradePackageId" TEXT NOT NULL,

    CONSTRAINT "UpgradePackageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UpgradePackageHistory_name_key" ON "UpgradePackageHistory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeOrder_upgradePackageHistoryId_key" ON "UpgradeOrder"("upgradePackageHistoryId");

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_upgradePackageHistoryId_fkey" FOREIGN KEY ("upgradePackageHistoryId") REFERENCES "UpgradePackageHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradePackageHistory" ADD CONSTRAINT "UpgradePackageHistory_originalUpgradePackageId_fkey" FOREIGN KEY ("originalUpgradePackageId") REFERENCES "UpgradePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
