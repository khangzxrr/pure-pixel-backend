import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayService } from './sepay.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly sepayService: SepayService,
  ) {}

  async findById(userId: string, id: string) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
      userId,
    });

    return transaction;
  }

  async generatePaymentUrl(userId: string, id: string) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
      userId,
    });

    return await this.sepayService.generatePayment(
      transaction.id,
      transaction.amount.toNumber(),
    );
  }
}
