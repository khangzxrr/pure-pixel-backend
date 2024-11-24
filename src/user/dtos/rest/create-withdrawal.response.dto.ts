import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalResponseDto {
  @ApiProperty()
  transactionId: string;

  constructor(transactionId: string) {
    this.transactionId = transactionId;
  }
}
