import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';

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

  @ApiProperty({
    description: 'payment method',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
