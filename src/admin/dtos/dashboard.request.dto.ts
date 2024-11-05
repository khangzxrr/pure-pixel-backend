import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class DashboardRequestDto {
  @ApiProperty({
    example: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  topUsedUpgradePackageCount: number;
}
