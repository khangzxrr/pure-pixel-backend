import { $Enums, UpgradePackage } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class UpgradePackageEntity implements UpgradePackage {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  price: Decimal;
  minOrderMonth: number;
  maxPhotoQuota: bigint;
  maxPackageCount: bigint;
  maxBookingPhotoQuota: bigint;
  maxBookingVideoQuota: bigint;
  descriptions: string[];
  status: $Enums.UpgradePackageStatus;
}
