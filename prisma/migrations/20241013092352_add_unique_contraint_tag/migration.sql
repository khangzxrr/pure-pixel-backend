/*
  Warnings:

  - A unique constraint covering the columns `[name,photoId]` on the table `PhotoTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PhotoTag_name_photoId_key" ON "PhotoTag"("name", "photoId");
