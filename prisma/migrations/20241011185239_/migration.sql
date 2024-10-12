/*
  Warnings:

  - You are about to drop the column `photoTags` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "photoTags";

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "photoId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_photoId_key" ON "Tag"("name", "photoId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
