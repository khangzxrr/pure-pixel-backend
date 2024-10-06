import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class PhotoBuyResponseDto {
  @ApiProperty()
  amount: Prisma.Decimal;

  @ApiProperty()
  fee: Prisma.Decimal;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  photoSellId: string;
}
