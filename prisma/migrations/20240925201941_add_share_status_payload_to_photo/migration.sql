-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('READY', 'NOT_READY');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "sharePayload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "shareStatus" "ShareStatus" NOT NULL DEFAULT 'NOT_READY';
