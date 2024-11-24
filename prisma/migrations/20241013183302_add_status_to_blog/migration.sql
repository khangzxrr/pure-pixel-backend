-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'ENABLED';
