/*
  Warnings:

  - You are about to drop the column `expiredAt` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "expiredAt",
ADD COLUMN     "successedAt" TIMESTAMP(3);
