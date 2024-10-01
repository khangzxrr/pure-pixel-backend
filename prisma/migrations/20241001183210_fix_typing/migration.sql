/*
  Warnings:

  - You are about to drop the column `bankUserName` on the `BankInfo` table. All the data in the column will be lost.
  - Added the required column `bankUsername` to the `BankInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BankInfo" DROP COLUMN "bankUserName",
ADD COLUMN     "bankUsername" TEXT NOT NULL;
