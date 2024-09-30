import { ApiProperty } from '@nestjs/swagger';

export class WalletDto {
  @ApiProperty()
  walletBalance: number;

  constructor(balance: number) {
    this.walletBalance = balance;
  }
}
