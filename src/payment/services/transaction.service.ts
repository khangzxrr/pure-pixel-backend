import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { NotBelongTransactionException } from '../exceptions/not-belong-transaction.exception';
import { SepayService } from './sepay.service';
import { paymentUrlDto } from '../dtos/payment-url.dto';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly sepayService: SepayService,
  ) {}

  async findById(userId: string, id: string) {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new TransactionNotFoundException();
    }

    // if (transaction. !== userId) {
    //   throw new NotBelongTransactionException();
    // }

    return transaction;
  }

  async generatePaymentUrl(
    userId: string,
    transactionId: string,
  ): Promise<paymentUrlDto> {
    const transaction =
      await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new TransactionNotFoundException();
    }

    if (transaction.userId !== userId) {
      throw new NotBelongTransactionException();
    }

    const mockQrCode = await this.sepayService.generateMockIpnQrCode(
      transactionId,
      transaction.amount.toNumber(),
    );

    const paymentUrl = this.sepayService.generatePaymentUrl(
      transactionId,
      transaction.amount.toNumber(),
    );

    return {
      mockQrCode,
      paymentUrl,
    };
  }
}
