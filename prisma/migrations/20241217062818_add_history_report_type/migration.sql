-- AlterEnum
ALTER TYPE "ReportType" ADD VALUE 'BOOKING_PHOTOGRAPHER_REPORT_USER';

-- AlterTable
ALTER TABLE "PhotoSellHistory" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT;
