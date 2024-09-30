import { Inject, Injectable } from '@nestjs/common';
import { WalletDto } from '../dtos/wallet.dto';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { Transaction } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
  ) {}

  async getWalletByUserId(userId: string): Promise<WalletDto> {
    const transactions =
      await this.transactionRepository.findAllByUserId(userId);

    const walletBalance = transactions.reduce((acc: number, t: Transaction) => {
      switch (t.type) {
        case 'DEPOSIT':
          return acc + t.amount.toNumber();
        case 'IMAGE_BUY':
          return acc - t.amount.toNumber();
        case 'IMAGE_SELL':
          return acc + t.amount.toNumber();
        case 'WITHDRAWAL':
          return acc - t.amount.toNumber();
        case 'UPGRADE_TO_PHOTOGRAPHER':
          if (t.paymentMethod == 'WALLET') {
            return acc - t.amount.toNumber();
          }
        default:
          return acc;
      }
    }, 0);

    return new WalletDto(walletBalance);
  }
}
