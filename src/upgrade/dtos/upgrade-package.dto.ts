import { ApiProperty } from '@nestjs/swagger';
import { Decimal, JsonObject } from '@prisma/client/runtime/library';

export class UpgradePackageDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  price: Decimal;
  @ApiProperty()
  description: JsonObject;
  @ApiProperty()
  quotaSize: Decimal;
  @ApiProperty()
  bookingQuotaSize: Decimal;
  @ApiProperty()
  status: string;
}
