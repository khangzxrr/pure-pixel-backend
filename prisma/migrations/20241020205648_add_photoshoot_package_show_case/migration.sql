/*
  Warnings:

  - Added the required column `description` to the `PhotoshootPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhotoshootPackage" ADD COLUMN     "description" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PhotoshootPackageShowcasePhoto" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoshootPackageId" TEXT,

    CONSTRAINT "PhotoshootPackageShowcasePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoshootPackageShowcasePhoto" ADD CONSTRAINT "PhotoshootPackageShowcasePhoto_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
