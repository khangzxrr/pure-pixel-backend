/*
  Warnings:

  - You are about to drop the column `transactionId` on the `UserToUserTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromUserTransactionId]` on the table `UserToUserTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[toUserTransactionId]` on the table `UserToUserTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromUserTransactionId` to the `UserToUserTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserToUserTransaction" DROP CONSTRAINT "UserToUserTransaction_transactionId_fkey";

-- DropIndex
DROP INDEX "UserToUserTransaction_transactionId_key";

-- AlterTable
ALTER TABLE "UserToUserTransaction" DROP COLUMN "transactionId",
ADD COLUMN     "fromUserTransactionId" TEXT NOT NULL,
ADD COLUMN     "toUserTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserToUserTransaction_fromUserTransactionId_key" ON "UserToUserTransaction"("fromUserTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToUserTransaction_toUserTransactionId_key" ON "UserToUserTransaction"("toUserTransactionId");

-- AddForeignKey
ALTER TABLE "UserToUserTransaction" ADD CONSTRAINT "UserToUserTransaction_fromUserTransactionId_fkey" FOREIGN KEY ("fromUserTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToUserTransaction" ADD CONSTRAINT "UserToUserTransaction_toUserTransactionId_fkey" FOREIGN KEY ("toUserTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
