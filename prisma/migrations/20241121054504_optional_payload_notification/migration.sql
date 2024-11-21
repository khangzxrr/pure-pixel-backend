/*
  Warnings:

  - You are about to drop the column `referenceId` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "referenceId",
ADD COLUMN     "payload" JSONB;
