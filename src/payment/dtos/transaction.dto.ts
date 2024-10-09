import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { JsonValue, Decimal } from '@prisma/client/runtime/library';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentPayload: JsonValue;

  @ApiProperty()
  paymentMethod: $Enums.PaymentMethod;

  @ApiProperty()
  type: $Enums.TransactionType;

  @ApiProperty()
  status: $Enums.TransactionStatus;

  @ApiProperty()
  amount: Decimal;

  @ApiProperty()
  fee: Decimal;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: string;
}
