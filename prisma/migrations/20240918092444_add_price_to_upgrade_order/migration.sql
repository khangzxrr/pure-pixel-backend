-- AlterTable
ALTER TABLE "UpgradeOrder" ADD COLUMN     "price" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UpgradePackage" ALTER COLUMN "price" SET DEFAULT 0;
