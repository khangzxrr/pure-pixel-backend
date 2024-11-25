import { Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';

export class PaymentCleanUpCronJob {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupPendingTransaction() {
    const now = new Date();
    const fiveMinusPrevious = new Date(now.getTime() - 1000 * 60 * 5);

    const threeDaysPrevious = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3);

    const updatedTransactions = await this.transactionRepository.update(
      {
        status: 'PENDING',
        type: {
          notIn: ['WITHDRAWAL'],
        },
        createdAt: {
          lte: fiveMinusPrevious,
        },
      },
      {
        status: 'EXPIRED',
      },
    );

    if (updatedTransactions.count > 0) {
      console.log(`clean up ${updatedTransactions.count} transactions`);
    }

    const updatedWithdrawalTransactions =
      await this.transactionRepository.update(
        {
          status: 'PENDING',
          type: 'WITHDRAWAL',
          createdAt: {
            lte: threeDaysPrevious,
          },
        },
        {
          status: 'EXPIRED',
        },
      );

    if (updatedWithdrawalTransactions.count > 0) {
      console.log(
        `clean up ${updatedWithdrawalTransactions.count} withdrawals transactions`,
      );
    }
  }
}
