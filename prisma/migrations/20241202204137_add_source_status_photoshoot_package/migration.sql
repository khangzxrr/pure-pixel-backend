-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('FILESYSTEM', 'CLOUD');

-- AlterTable
ALTER TABLE "PhotoshootPackage" ADD COLUMN     "sourceStatus" "SourceStatus" NOT NULL DEFAULT 'CLOUD';
