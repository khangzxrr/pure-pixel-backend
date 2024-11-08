/*
  Warnings:

  - You are about to drop the column `size` on the `Pricetag` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pricetag" DROP COLUMN "size",
ADD COLUMN     "height" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "width" INTEGER NOT NULL DEFAULT 0;
