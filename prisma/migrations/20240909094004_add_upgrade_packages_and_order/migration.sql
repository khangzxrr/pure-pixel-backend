-- CreateEnum
CREATE TYPE "UpgradePackageStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateTable
CREATE TABLE "UpgradeOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "description" JSONB NOT NULL,
    "quotaSize" DECIMAL(65,30) NOT NULL,
    "bookingQuotaSize" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "UpgradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradePackage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "description" JSONB NOT NULL,
    "quotaSize" DECIMAL(65,30) NOT NULL,
    "bookingQuotaSize" DECIMAL(65,30) NOT NULL,
    "status" "UpgradePackageStatus" NOT NULL,

    CONSTRAINT "UpgradePackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
