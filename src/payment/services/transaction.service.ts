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
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';

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

    const wallet = await this.sepayService.getWalletByUserId(
      transaction.userId,
    );

    if (
      updateDto.status === 'SUCCESS' &&
      transaction.amount.toNumber() > wallet.walletBalance
    ) {
      throw new NotEnoughBalanceException();
    }

    await this.transactionRepository.update(
      {
        id,
      },
      {
        status: updateDto.status,
      },
    );
  }

  async findAll(findAllDto: FindAllTransactionDto, query: string) {
    const where = findAllDto.toWhere();

    const count = await this.transactionRepository.countAll(where);
    const transactions = await this.transactionRepository.findAll(
      where,
      findAllDto.toSkip(),
      findAllDto.limit,
      findAllDto.toOrderBy(query),
    );

    const transactionDtos = plainToInstance(TransactionDto, transactions);
    const transactionWalletDtoPromises = transactionDtos.map(async (t) => {
      t.wallet = await this.sepayService.getWalletByUserId(t.userId);

      return t;
    });

    const transactionWalletDtos = await Promise.all(
      transactionWalletDtoPromises,
    );

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllDto.limit,
      count,
      transactionWalletDtos,
    );

    return response;
  }

  async findById(id: string) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
    });

    const transactionDto = plainToInstance(TransactionDto, transaction);
    transactionDto.wallet = await this.sepayService.getWalletByUserId(
      transaction.userId,
    );

    return transactionDto;
  }

  async findByUserIdAndId(userId: string, id: string) {
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
