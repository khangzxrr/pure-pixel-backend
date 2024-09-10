-- DropForeignKey
ALTER TABLE "UpgradeOrder" DROP CONSTRAINT "UpgradeOrder_transactionId_fkey";

-- AddForeignKey
ALTER TABLE "UpgradeOrder" ADD CONSTRAINT "UpgradeOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
