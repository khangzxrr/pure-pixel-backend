import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '@prisma/client';

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
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor({ ...data }: Partial<Transaction>) {
    Object.assign(this, data);

    if (data.amount) {
      this.amount = data.amount.toNumber();
    }
  }
}
