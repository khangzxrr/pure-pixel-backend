import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { TransactionDto } from 'src/user/dtos/transaction.dto';

export class UserToUserTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  toUserId: string;

  @Exclude()
  transactionId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  @Type(() => TransactionDto)
  fromUserTransaction: TransactionDto;

  @ApiProperty()
  @Type(() => TransactionDto)
  toUserTransaction: TransactionDto;
}
