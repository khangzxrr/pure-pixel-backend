/*
  Warnings:

  - You are about to drop the column `userId` on the `PhotoSell` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoSell" DROP CONSTRAINT "PhotoSell_userId_fkey";

-- AlterTable
ALTER TABLE "PhotoSell" DROP COLUMN "userId";
