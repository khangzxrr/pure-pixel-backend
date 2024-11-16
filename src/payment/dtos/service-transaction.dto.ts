import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from 'src/user/dtos/transaction.dto';

export class ServiceTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  @Type(() => TransactionDto)
  transaction: TransactionDto;
}
