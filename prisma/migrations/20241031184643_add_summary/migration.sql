-- AlterTable
ALTER TABLE "UpgradePackage" ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "UpgradePackageHistory" ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '';
