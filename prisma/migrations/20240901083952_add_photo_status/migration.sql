-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('PARSED', 'PENDING');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "status" "PhotoStatus" NOT NULL DEFAULT 'PENDING';
