import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentPayload: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  @Type(() => Number)
  fee: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
