-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bookingPhotoQuotaUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bookingVideoQuotaUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "packageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "photoQuotaUsage" INTEGER NOT NULL DEFAULT 0;
