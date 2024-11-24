/*
  Warnings:

  - The values [FIRST_BOOKING_PAYMENT,SECOND_BOOKING_PAYMENT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `UpgradeOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceTransactionId]` on the table `UpgradeOrder` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `paymentMethod` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `serviceTransactionId` to the `UpgradeOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'SEPAY');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('UPGRADE_TO_PHOTOGRAPHER', 'IMAGE_SELL', 'IMAGE_BUY', 'DEPOSIT', 'WITHDRAWAL');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UpgradeOrder" DROP CONSTRAINT "UpgradeOrder_transactionId_fkey";

-- DropIndex
DROP INDEX "UpgradeOrder_transactionId_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "userId",
ADD COLUMN     "upgradeOrderId" TEXT,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UpgradeOrder" DROP COLUMN "transactionId",
ADD COLUMN     "serviceTransactionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BankInfo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankNumber" TEXT NOT NULL,
    "bankUserName" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "BankInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToUserTransaction" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToUserTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankInfoId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankInfo_id_key" ON "BankInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserToUserTransaction_id_key" ON "UserToUserTransaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserToUserTransaction_transactionId_key" ON "UserToUserTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalTransaction_id_key" ON "WithdrawalTransaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalTransaction_transactionId_key" ON "WithdrawalTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositTransaction_id_key" ON "DepositTransaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DepositTransaction_transactionId_key" ON "DepositTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTransaction_id_key" ON "ServiceTransaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTransaction_transactionId_key" ON "ServiceTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeOrder_serviceTransactionId_key" ON "UpgradeOrder"("serviceTransactionId");

-- AddForeignKey
ALTER TABLE "BankInfo" ADD CONSTRAINT "BankInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_upgradeOrderId_fkey" FOREIGN KEY ("upgradeOrderId") REFERENCES "UpgradeOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToUserTransaction" ADD CONSTRAINT "UserToUserTransaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToUserTransaction" ADD CONSTRAINT "UserToUserTransaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToUserTransaction" ADD CONSTRAINT "UserToUserTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalTransaction" ADD CONSTRAINT "WithdrawalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalTransaction" ADD CONSTRAINT "WithdrawalTransaction_bankInfoId_fkey" FOREIGN KEY ("bankInfoId") REFERENCES "BankInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalTransaction" ADD CONSTRAINT "WithdrawalTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositTransaction" ADD CONSTRAINT "DepositTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositTransaction" ADD CONSTRAINT "DepositTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTransaction" ADD CONSTRAINT "ServiceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTransaction" ADD CONSTRAINT "ServiceTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_serviceTransactionId_fkey" FOREIGN KEY ("serviceTransactionId") REFERENCES "ServiceTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
