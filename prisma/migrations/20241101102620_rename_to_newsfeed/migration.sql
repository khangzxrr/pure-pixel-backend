/*
  Warnings:

  - You are about to drop the `NewsFeed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NewsFeedComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NewsFeedLike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NewsFeedViewPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NewsFeedToPhoto` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NewsfeedVisibility" AS ENUM ('PUBLIC', 'ONLY_FOLLOWER', 'ONLY_ME');

-- DropForeignKey
ALTER TABLE "NewsFeed" DROP CONSTRAINT "NewsFeed_userId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedComment" DROP CONSTRAINT "NewsFeedComment_newsFeedId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedComment" DROP CONSTRAINT "NewsFeedComment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedComment" DROP CONSTRAINT "NewsFeedComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedLike" DROP CONSTRAINT "NewsFeedLike_newsFeedId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedLike" DROP CONSTRAINT "NewsFeedLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedViewPermission" DROP CONSTRAINT "NewsFeedViewPermission_newsFeedId_fkey";

-- DropForeignKey
ALTER TABLE "NewsFeedViewPermission" DROP CONSTRAINT "NewsFeedViewPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "_NewsFeedToPhoto" DROP CONSTRAINT "_NewsFeedToPhoto_A_fkey";

-- DropForeignKey
ALTER TABLE "_NewsFeedToPhoto" DROP CONSTRAINT "_NewsFeedToPhoto_B_fkey";

-- DropTable
DROP TABLE "NewsFeed";

-- DropTable
DROP TABLE "NewsFeedComment";

-- DropTable
DROP TABLE "NewsFeedLike";

-- DropTable
DROP TABLE "NewsFeedViewPermission";

-- DropTable
DROP TABLE "_NewsFeedToPhoto";

-- DropEnum
DROP TYPE "NewsFeedVisibility";

-- CreateTable
CREATE TABLE "Newsfeed" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visibility" "NewsfeedVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newsfeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsfeedViewPermission" (
    "id" TEXT NOT NULL,
    "newsfeedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "ViewPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsfeedViewPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsfeedLike" (
    "id" TEXT NOT NULL,
    "newsfeedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsfeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsfeedComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsfeedId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsfeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NewsfeedToPhoto" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Newsfeed_id_key" ON "Newsfeed"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NewsfeedViewPermission_newsfeedId_userId_key" ON "NewsfeedViewPermission"("newsfeedId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsfeedLike_newsfeedId_userId_key" ON "NewsfeedLike"("newsfeedId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_NewsfeedToPhoto_AB_unique" ON "_NewsfeedToPhoto"("A", "B");

-- CreateIndex
CREATE INDEX "_NewsfeedToPhoto_B_index" ON "_NewsfeedToPhoto"("B");

-- AddForeignKey
ALTER TABLE "Newsfeed" ADD CONSTRAINT "Newsfeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedViewPermission" ADD CONSTRAINT "NewsfeedViewPermission_newsfeedId_fkey" FOREIGN KEY ("newsfeedId") REFERENCES "Newsfeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedViewPermission" ADD CONSTRAINT "NewsfeedViewPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedLike" ADD CONSTRAINT "NewsfeedLike_newsfeedId_fkey" FOREIGN KEY ("newsfeedId") REFERENCES "Newsfeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedLike" ADD CONSTRAINT "NewsfeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedComment" ADD CONSTRAINT "NewsfeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedComment" ADD CONSTRAINT "NewsfeedComment_newsfeedId_fkey" FOREIGN KEY ("newsfeedId") REFERENCES "Newsfeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsfeedComment" ADD CONSTRAINT "NewsfeedComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NewsfeedComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsfeedToPhoto" ADD CONSTRAINT "_NewsfeedToPhoto_A_fkey" FOREIGN KEY ("A") REFERENCES "Newsfeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsfeedToPhoto" ADD CONSTRAINT "_NewsfeedToPhoto_B_fkey" FOREIGN KEY ("B") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
