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

    const updatedTransactions = await this.transactionRepository.update(
      {
        status: 'PENDING',
        createdAt: {
          lte: fiveMinusPrevious,
        },
      },
      {
        status: 'EXPIRED',
      },
    );

    console.log(`clean up ${updatedTransactions.count} transactions`);
  }
}
