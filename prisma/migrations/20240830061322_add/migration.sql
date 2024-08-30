/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "location",
DROP COLUMN "nickname",
DROP COLUMN "title",
ADD COLUMN     "diskQuota" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "diskUsage" DECIMAL(65,30) NOT NULL DEFAULT 0;
