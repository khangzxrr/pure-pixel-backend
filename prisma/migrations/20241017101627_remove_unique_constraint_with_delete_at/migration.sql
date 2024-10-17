/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `UpgradePackage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UpgradePackage_name_deletedAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "UpgradePackage_name_key" ON "UpgradePackage"("name");
