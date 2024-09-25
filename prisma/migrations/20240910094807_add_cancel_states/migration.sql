-- CreateEnum
CREATE TYPE "UpgradeOrderStatus" AS ENUM ('ACTIVE', 'EXPIRE', 'PENDING', 'CANCEL');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'CANCEL';

COMMIT;
