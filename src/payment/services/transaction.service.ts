import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
  ) {}

  async findById(userId: string, id: string) {
    console.log(userId);
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new TransactionNotFoundException();
    }

    // if (transaction. !== userId) {
    //   throw new NotBelongTransactionException();
    // }

    return transaction;
  }
}
