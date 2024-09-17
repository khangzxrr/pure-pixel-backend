/*
  Warnings:

  - You are about to drop the column `isActive` on the `UpgradeOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UpgradeOrder" DROP COLUMN "isActive",
ADD COLUMN     "status" "UpgradeOrderStatus" NOT NULL DEFAULT 'PENDING';
