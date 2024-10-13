/*
  Warnings:

  - You are about to drop the `PhotoTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoTag" DROP CONSTRAINT "PhotoTag_photoId_fkey";

-- DropTable
DROP TABLE "PhotoTag";

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_photoId_key" ON "Tag"("name", "photoId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
