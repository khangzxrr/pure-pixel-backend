import { $Enums, UpgradePackage } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class UpgradePackageEntity implements UpgradePackage {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  price: Decimal;
  minOrderMonth: number;
  maxPhotoQuota: number;
  maxPackageCount: number;
  maxBookingPhotoQuota: number;
  maxBookingVideoQuota: number;
  descriptions: string[];
  status: $Enums.UpgradePackageStatus;
}
