/*
  Warnings:

  - You are about to drop the `PhotoSharing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoSharing" DROP CONSTRAINT "PhotoSharing_originalPhotoId_fkey";

-- DropTable
DROP TABLE "PhotoSharing";
