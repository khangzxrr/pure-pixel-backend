/*
  Warnings:

  - Added the required column `name` to the `UpgradeOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UpgradeOrder" ADD COLUMN     "name" TEXT NOT NULL;
