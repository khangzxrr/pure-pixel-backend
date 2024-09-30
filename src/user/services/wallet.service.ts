import { Inject, Injectable } from '@nestjs/common';
import { WalletDto } from '../dtos/wallet.dto';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { Transaction } from '@prisma/client';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';

@Injectable()
export class WalletService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
  ) {}

  async findAllTransactionByUserId(
    userId: string,
    findAllTransactionDto: FindAllTransactionDto,
  ): Promise<PagingPaginatedResposneDto<TransactionDto>> {
    const count = await this.transactionRepository.countAllByUserId(userId);
    const transactions = await this.transactionRepository.findAllByUserId(
      userId,
      [
        {
          type: findAllTransactionDto.orderByType,
        },
        {
          amount: findAllTransactionDto.orderByAmount,
        },
        {
          createdAt: findAllTransactionDto.orderByCreatedAt,
        },
        {
          paymentMethod: findAllTransactionDto.orderByPaymentMethod,
        },
      ],
    );

    const transactionDtos = transactions.map((t) => new TransactionDto(t));

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllTransactionDto.limit,
      count,
      transactionDtos,
    );

    return response;
  }

  async getWalletByUserId(userId: string): Promise<WalletDto> {
    const transactions =
      await this.transactionRepository.findAllByUserId(userId);

    const walletBalance = transactions.reduce((acc: number, t: Transaction) => {
      switch (t.type) {
        case 'DEPOSIT':
          return acc + t.amount.toNumber();

        case 'IMAGE_BUY':
          if (t.paymentMethod == 'WALLET') {
            return acc - t.amount.toNumber();
          }
          break;

        case 'IMAGE_SELL':
          if (t.paymentMethod == 'WALLET') {
            return acc + t.amount.toNumber();
          }
          break;

        case 'WITHDRAWAL':
          return acc - t.amount.toNumber();

        case 'UPGRADE_TO_PHOTOGRAPHER':
          if (t.paymentMethod == 'WALLET') {
            return acc - t.amount.toNumber();
          }
          break;

        default:
          return acc;
      }

      return acc;
    }, 0);

    return new WalletDto(walletBalance);
  }
}
