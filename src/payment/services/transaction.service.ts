import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayService } from './sepay.service';

import { plainToInstance } from 'class-transformer';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { Prisma } from '@prisma/client';
import { TransactionUpdateDto } from '../dtos/transaction-update.dto';
import { TransactionNotInPendingException } from '../exceptions/transaction-not-in-pending.exception';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly sepayService: SepayService,
  ) {}

  async update(id: string, updateDto: TransactionUpdateDto) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
    });

    if (transaction.status !== 'PENDING') {
      throw new TransactionNotInPendingException();
    }

    const updatedTransaction = await this.transactionRepository.update(
      {
        id,
      },
      {
        status: updateDto.status,
      },
    );

    return plainToInstance(TransactionDto, updatedTransaction);
  }

  async findAll(findAllDto: FindAllTransactionDto) {
    const where: Prisma.TransactionWhereInput = {
      type: findAllDto.type,
      status: findAllDto.status,
    };

    const orderBy = [
      {
        type: findAllDto.orderByType,
      },
      {
        amount: findAllDto.orderByAmount,
      },
      {
        createdAt: findAllDto.orderByCreatedAt,
      },
      {
        paymentMethod: findAllDto.orderByPaymentMethod,
      },
    ];

    const count = await this.transactionRepository.countAll(where);
    const transactions = await this.transactionRepository.findAll(
      where,
      findAllDto.toSkip(),
      findAllDto.limit,
      orderBy,
    );

    const transactionDtos = plainToInstance(TransactionDto, transactions);

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllDto.limit,
      count,
      transactionDtos,
    );

    return response;
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
