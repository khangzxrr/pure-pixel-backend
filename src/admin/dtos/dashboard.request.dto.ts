import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class DashboardRequestDto {
  @ApiProperty({
    example: 5,
  })
  @IsNumber()
  topUsedUpgradePackageCount: number;
}
