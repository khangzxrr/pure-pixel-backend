import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayService } from './sepay.service';

import { plainToInstance } from 'class-transformer';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly sepayService: SepayService,
  ) {}

  async findAll(findAllDto: FindAllTransactionDto) {
    const transactions = await this.transactionRepository.findAll(
      {},
      findAllDto.toSkip(),
      findAllDto.limit,
    );
    console.log(transactions);

    const transactionDtos = plainToInstance(TransactionDto, transactions);

    return transactionDtos;
  }

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
