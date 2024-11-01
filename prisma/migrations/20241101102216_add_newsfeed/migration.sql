/*
  Warnings:

  - The values [SHARE_LINK] on the enum `PhotoVisibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "NewsFeedVisibility" AS ENUM ('PUBLIC', 'ONLY_FOLLOWER', 'ONLY_ME');

-- CreateEnum
CREATE TYPE "ViewPermission" AS ENUM ('ALLOW', 'DENY');

-- AlterEnum
BEGIN;
CREATE TYPE "PhotoVisibility_new" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "Photo" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "Photo" ALTER COLUMN "visibility" TYPE "PhotoVisibility_new" USING ("visibility"::text::"PhotoVisibility_new");
ALTER TYPE "PhotoVisibility" RENAME TO "PhotoVisibility_old";
ALTER TYPE "PhotoVisibility_new" RENAME TO "PhotoVisibility";
DROP TYPE "PhotoVisibility_old";
ALTER TABLE "Photo" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
COMMIT;

-- CreateTable
CREATE TABLE "NewsFeed" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visibility" "NewsFeedVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsFeedViewPermission" (
    "id" TEXT NOT NULL,
    "newsFeedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "ViewPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsFeedViewPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsFeedLike" (
    "id" TEXT NOT NULL,
    "newsFeedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsFeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsFeedComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsFeedId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsFeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NewsFeedToPhoto" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsFeed_id_key" ON "NewsFeed"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NewsFeedViewPermission_newsFeedId_userId_key" ON "NewsFeedViewPermission"("newsFeedId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsFeedLike_newsFeedId_userId_key" ON "NewsFeedLike"("newsFeedId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_NewsFeedToPhoto_AB_unique" ON "_NewsFeedToPhoto"("A", "B");

-- CreateIndex
CREATE INDEX "_NewsFeedToPhoto_B_index" ON "_NewsFeedToPhoto"("B");

-- AddForeignKey
ALTER TABLE "NewsFeed" ADD CONSTRAINT "NewsFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedViewPermission" ADD CONSTRAINT "NewsFeedViewPermission_newsFeedId_fkey" FOREIGN KEY ("newsFeedId") REFERENCES "NewsFeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedViewPermission" ADD CONSTRAINT "NewsFeedViewPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedLike" ADD CONSTRAINT "NewsFeedLike_newsFeedId_fkey" FOREIGN KEY ("newsFeedId") REFERENCES "NewsFeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedLike" ADD CONSTRAINT "NewsFeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedComment" ADD CONSTRAINT "NewsFeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedComment" ADD CONSTRAINT "NewsFeedComment_newsFeedId_fkey" FOREIGN KEY ("newsFeedId") REFERENCES "NewsFeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsFeedComment" ADD CONSTRAINT "NewsFeedComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NewsFeedComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsFeedToPhoto" ADD CONSTRAINT "_NewsFeedToPhoto_A_fkey" FOREIGN KEY ("A") REFERENCES "NewsFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsFeedToPhoto" ADD CONSTRAINT "_NewsFeedToPhoto_B_fkey" FOREIGN KEY ("B") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
