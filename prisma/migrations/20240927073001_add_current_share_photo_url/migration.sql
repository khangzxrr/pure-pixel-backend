-- AlterEnum
ALTER TYPE "ShareStatus" ADD VALUE 'SHARED';

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "currentSharePhotoUrl" TEXT NOT NULL DEFAULT '';
