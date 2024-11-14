import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';

export class RequestUpgradeDto {
  @ApiProperty({
    description: 'upgrade package ID',
  })
  @IsString()
  upgradePackageId: string;

  @ApiProperty({
    description: 'number of month this order expired',
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  totalMonths: number;
}
