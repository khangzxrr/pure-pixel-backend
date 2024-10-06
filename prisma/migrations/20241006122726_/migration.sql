/*
  Warnings:

  - You are about to drop the column `photoId` on the `PhotoBuy` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoBuy" DROP CONSTRAINT "PhotoBuy_photoId_fkey";

-- AlterTable
ALTER TABLE "PhotoBuy" DROP COLUMN "photoId";
