/*
  Warnings:

  - You are about to drop the column `authorId` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `metaData` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `cameraSetting` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `captureTime` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `colorGrading` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPhotoUrl` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoType` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photographerId` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailPhotoUrl` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visibility` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhotoVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'SHARE_LINK');

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_authorId_fkey";

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "authorId",
DROP COLUMN "metaData",
ADD COLUMN     "cameraSetting" JSONB NOT NULL,
ADD COLUMN     "captureTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "colorGrading" JSONB NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "originalPhotoUrl" TEXT NOT NULL,
ADD COLUMN     "photoTags" TEXT[],
ADD COLUMN     "photoType" "PhotoType" NOT NULL,
ADD COLUMN     "photographerId" TEXT NOT NULL,
ADD COLUMN     "thumbnailPhotoUrl" TEXT NOT NULL,
ADD COLUMN     "visibility" "PhotoVisibility" NOT NULL;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
