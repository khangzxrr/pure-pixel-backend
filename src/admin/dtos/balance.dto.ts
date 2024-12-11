import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BalanceDto {
  @ApiProperty()
  @Type(() => Number)
  totalBalance: number;

  @ApiProperty()
  @Type(() => Number)
  totalWithdrawal: number;
}
