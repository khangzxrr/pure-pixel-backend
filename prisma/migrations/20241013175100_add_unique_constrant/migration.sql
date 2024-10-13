/*
  Warnings:

  - A unique constraint covering the columns `[userId,photoId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_photoId_key" ON "Vote"("userId", "photoId");
