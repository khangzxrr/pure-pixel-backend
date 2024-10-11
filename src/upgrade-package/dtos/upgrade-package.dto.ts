import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpgradePackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  description: string[];

  @ApiProperty()
  status: string;

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
}
