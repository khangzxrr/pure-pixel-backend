/*
  Warnings:

  - You are about to drop the column `captureTime` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "captureTime",
DROP COLUMN "location";
