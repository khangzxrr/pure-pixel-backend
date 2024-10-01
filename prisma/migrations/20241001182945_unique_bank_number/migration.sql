/*
  Warnings:

  - A unique constraint covering the columns `[bankNumber]` on the table `BankInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BankInfo_bankNumber_key" ON "BankInfo"("bankNumber");
