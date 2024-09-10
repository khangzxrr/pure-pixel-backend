import { $Enums, UpgradeOrder as PrismaUpgradeOrder } from '@prisma/client';
import { Decimal, JsonValue } from '@prisma/client/runtime/library';

export class UpgradeOrder implements PrismaUpgradeOrder {
  status: $Enums.UpgradeOrderStatus;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  originalUpgradePackageId: string;
  userId: string;
  transactionId: string;
  name: string;
  price: Decimal;
  description: JsonValue;
  quotaSize: Decimal;
  bookingQuotaSize: Decimal;
}
