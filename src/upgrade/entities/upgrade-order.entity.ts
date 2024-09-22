import { $Enums, UpgradeOrder as PrismaUpgradeOrder } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class UpgradeOrder implements PrismaUpgradeOrder {
  name: string;
  price: Decimal;
  minOrderMonth: number;
  maxPhotoCount: number;
  maxPackageCount: number;
  maxBookingPhotoCount: number;
  maxBookingVideoCount: number;
  descriptions: string[];

  originalUpgradePackageId: string;

  expiredAt: Date;
  status: $Enums.UpgradeOrderStatus;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  transactionId: string;
}
