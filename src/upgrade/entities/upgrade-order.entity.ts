import { $Enums, UpgradeOrder as PrismaUpgradeOrder } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class UpgradeOrder implements PrismaUpgradeOrder {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date;
  originalUpgradePackageId: string;
  userId: string;
  status: $Enums.UpgradeOrderStatus;
  transactionId: string;
  name: string;
  price: Decimal;
  minOrderMonth: number;
  maxPhotoQuota: bigint;
  maxPackageCount: bigint;
  maxBookingPhotoQuota: bigint;
  maxBookingVideoQuota: bigint;
  descriptions: string[];
}
