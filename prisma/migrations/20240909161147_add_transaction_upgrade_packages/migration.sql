/*
  Warnings:

  - You are about to drop the column `ftpEndpoint` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `UpgradeOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `originalUpgradePackageId` to the `UpgradeOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `UpgradeOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('UPGRADE_TO_PHOTOGRAPHER', 'IMAGE_SELL', 'IMAGE_BUY', 'FIRST_BOOKING_PAYMENT', 'SECOND_BOOKING_PAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "UpgradeOrder" ADD COLUMN     "originalUpgradePackageId" TEXT NOT NULL,
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "ftpEndpoint";

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentPayload" JSONB NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_id_key" ON "Transaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeOrder_transactionId_key" ON "UpgradeOrder"("transactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_originalUpgradePackageId_fkey" FOREIGN KEY ("originalUpgradePackageId") REFERENCES "UpgradePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
