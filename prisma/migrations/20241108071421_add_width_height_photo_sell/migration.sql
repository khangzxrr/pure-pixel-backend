/*
  Warnings:

  - You are about to drop the column `size` on the `PhotoSellHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PhotoSellHistory" DROP COLUMN "size",
ADD COLUMN     "height" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "width" INTEGER NOT NULL DEFAULT 0;
