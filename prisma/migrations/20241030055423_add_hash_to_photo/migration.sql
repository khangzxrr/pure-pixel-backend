-- AlterEnum
ALTER TYPE "PhotoStatus" ADD VALUE 'DUPLICATED';

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "hash" TEXT NOT NULL DEFAULT '';
