import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class DenyWithdrawalTransactionDto {
  @ApiProperty()
  @IsNotEmpty()
  failReason: string;
}
