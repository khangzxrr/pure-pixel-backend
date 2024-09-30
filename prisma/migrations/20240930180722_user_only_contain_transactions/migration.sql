/*
  Warnings:

  - You are about to drop the column `userId` on the `DepositTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ServiceTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `fromUserId` on the `UserToUserTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WithdrawalTransaction` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DepositTransaction" DROP CONSTRAINT "DepositTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceTransaction" DROP CONSTRAINT "ServiceTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserToUserTransaction" DROP CONSTRAINT "UserToUserTransaction_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalTransaction" DROP CONSTRAINT "WithdrawalTransaction_userId_fkey";

-- AlterTable
ALTER TABLE "DepositTransaction" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "ServiceTransaction" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserToUserTransaction" DROP COLUMN "fromUserId";

-- AlterTable
ALTER TABLE "WithdrawalTransaction" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
