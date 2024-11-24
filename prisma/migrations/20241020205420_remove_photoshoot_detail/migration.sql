/*
  Warnings:

  - You are about to drop the `PhotoshootDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoshootDetail" DROP CONSTRAINT "PhotoshootDetail_photoshootPackageId_fkey";

-- DropTable
DROP TABLE "PhotoshootDetail";
