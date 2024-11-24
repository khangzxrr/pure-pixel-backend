/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_photoId_fkey";

-- DropTable
DROP TABLE "Tag";

-- CreateTable
CREATE TABLE "PhotoTag" (
    "name" TEXT NOT NULL,
    "photoId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoTag_name_photoId_key" ON "PhotoTag"("name", "photoId");

-- AddForeignKey
ALTER TABLE "PhotoTag" ADD CONSTRAINT "PhotoTag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
