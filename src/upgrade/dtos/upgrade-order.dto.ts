import { ApiProperty } from '@nestjs/swagger';
import { UpgradeOrder } from '@prisma/client';

export class UpgradeOrderDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  minOrderMonth: number;

  @ApiProperty()
  maxPhotoQuota: number;

  @ApiProperty()
  maxPackageCount: number;

  @ApiProperty()
  maxBookingPhotoQuota: number;

  @ApiProperty()
  maxBookingVideoQuota: number;

  @ApiProperty()
  descriptions: string[];

  @ApiProperty()
  originalUpgradePackageId: string;

  @ApiProperty()
  expiredAt: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  transactionId: string;

  constructor({ ...data }: Partial<UpgradeOrder>) {
    Object.assign(this, data);

    if (data.status) {
      this.status = data.status.toString();
    }

    if (data.price) {
      this.price = data.price.toNumber();
    }
  }
}
