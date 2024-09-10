-- DropForeignKey
ALTER TABLE "UpgradeOrder" DROP CONSTRAINT "UpgradeOrder_transactionId_fkey";

-- AlterTable
ALTER TABLE "UpgradeOrder" ALTER COLUMN "transactionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
