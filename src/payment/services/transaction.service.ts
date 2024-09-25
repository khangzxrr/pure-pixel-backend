import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { NotBelongTransactionException } from '../exceptions/not-belong-transaction.exception';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
  ) {}

  async findById(userId: string, id: string) {
    console.log(userId);
    const transaction = await this.transactionRepository.getById(id);

    if (!transaction) {
      throw new TransactionNotFoundException();
    }

    if (transaction.userId !== userId) {
      throw new NotBelongTransactionException();
    }

    return transaction;
  }
}
