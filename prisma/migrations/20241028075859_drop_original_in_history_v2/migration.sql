/*
  Warnings:

  - You are about to drop the column `photoshootPackageId` on the `PhotoshootPackageHistory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoshootPackageHistory" DROP CONSTRAINT "PhotoshootPackageHistory_photoshootPackageId_fkey";

-- AlterTable
ALTER TABLE "PhotoshootPackageHistory" DROP COLUMN "photoshootPackageId";
