/*
  Warnings:

  - You are about to drop the column `bankInfoId` on the `WithdrawalTransaction` table. All the data in the column will be lost.
  - You are about to drop the `BankInfo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bankName` to the `WithdrawalTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankNumber` to the `WithdrawalTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankUsername` to the `WithdrawalTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BankInfo" DROP CONSTRAINT "BankInfo_userId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalTransaction" DROP CONSTRAINT "WithdrawalTransaction_bankInfoId_fkey";

-- AlterTable
ALTER TABLE "WithdrawalTransaction" DROP COLUMN "bankInfoId",
ADD COLUMN     "bankName" TEXT NOT NULL,
ADD COLUMN     "bankNumber" TEXT NOT NULL,
ADD COLUMN     "bankUsername" TEXT NOT NULL;

-- DropTable
DROP TABLE "BankInfo";
