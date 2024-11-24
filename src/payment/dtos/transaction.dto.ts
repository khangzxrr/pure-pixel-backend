import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { JsonValue, Decimal } from '@prisma/client/runtime/library';
import { Type } from 'class-transformer';
import { UserToUserTransactionDto } from './user-to-user-transaction.dto';
import { ServiceTransactionDto } from './service-transaction.dto';
import { UserDto } from 'src/user/dtos/user.dto';

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
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty()
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  @Type(() => Number)
  fee: Decimal;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  @Type(() => UserToUserTransactionDto)
  toUserTransaction: UserToUserTransactionDto;

  @ApiProperty()
  @Type(() => ServiceTransactionDto)
  serviceTransaction: ServiceTransactionDto;
}
