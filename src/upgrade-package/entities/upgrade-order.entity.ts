import { $Enums, UpgradeOrder as PrismaUpgradeOrder } from '@prisma/client';

export class UpgradeOrder implements PrismaUpgradeOrder {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date;
  userId: string;
  status: $Enums.UpgradeOrderStatus;
  serviceTransactionId: string;
  upgradePackageHistoryId: string;
}
