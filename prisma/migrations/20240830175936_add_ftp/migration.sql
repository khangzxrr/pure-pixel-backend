-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ftpEndpoint" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ftpPassword" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ftpUsername" TEXT NOT NULL DEFAULT '';
