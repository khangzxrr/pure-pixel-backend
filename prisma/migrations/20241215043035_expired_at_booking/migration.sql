-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiredAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + '30 days'::interval);
