/*
  Warnings:

  - Added the required column `status` to the `PhotoshootPackage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhotoshootPackageStatus" AS ENUM ('ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "PhotoshootPackage" ADD COLUMN     "status" "PhotoshootPackageStatus" NOT NULL;
