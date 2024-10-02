/*
  Warnings:

  - You are about to drop the column `currentSharePhotoUrl` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `quality` to the `PhotoSharing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "currentSharePhotoUrl";

-- AlterTable
ALTER TABLE "PhotoSharing" ADD COLUMN     "quality" TEXT NOT NULL;
