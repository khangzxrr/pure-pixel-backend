import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayService } from './sepay.service';

import { plainToInstance } from 'class-transformer';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { Prisma, WithdrawalTransaction } from '@prisma/client';
import { TransactionUpdateDto } from '../dtos/transaction-update.dto';
import { TransactionNotInPendingException } from '../exceptions/transaction-not-in-pending.exception';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { AcceptWithdrawalTransactionDto } from '../dtos/rest/accept-withdrawal-transaction.dto';
import { NotAWithdrawalTransaction } from '../exceptions/not-a-withdrawal-transaction.exception';
import { BunnyService } from 'src/storage/services/bunny.service';

import { DenyWithdrawalTransactionDto } from '../dtos/rest/deny-withdrawal-transaction.dto';
import { NotificationService } from 'src/notification/services/notification.service';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject()
    private readonly withdrawalTransactionRepository: WithdrawalTransactionRepository,
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly bunnyService: BunnyService,

    @Inject() private readonly notificationService: NotificationService,
    @Inject() private readonly prismaService: PrismaService,
  ) {}

  async acceptWithdrawal(
    id: string,
    acceptDto: AcceptWithdrawalTransactionDto,
  ) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
    });

    if (transaction.type !== 'WITHDRAWAL') {
      throw new NotAWithdrawalTransaction();
    }

    if (transaction.status !== 'PENDING') {
      throw new TransactionNotInPendingException();
    }

    const photoUrl = await this.bunnyService.uploadPublicFromBuffer(
      acceptDto.photo.buffer,
      `${transaction.id}.webp`,
    );

    await this.prismaService.$transaction(async (tx) => {
      await this.transactionRepository.update(
        {
          id,
        },
        {
          status: 'SUCCESS',
        },
        tx,
      );
      await this.withdrawalTransactionRepository.update(
        {
          id: transaction.withdrawalTransaction.id,
        },
        {
          successPhotoUrl: photoUrl,
        },
        tx,
      );
    });

    await this.notificationService.addNotificationToQueue({
      userId: transaction.userId,
      type: 'BOTH_INAPP_EMAIL',
      title: 'Rút tiền thành công',
      content:
        'Yêu cầu rút tiền của bạn đã được duyệt thành công, vui lòng kiểm tra',
      payload: {
        id: transaction.id,
      },
      referenceType: 'SUCCESS_WITHDRAWAL',
    });
  }

  async denyWithdrawal(id: string, denyDto: DenyWithdrawalTransactionDto) {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
    });

    console.log(transaction);

    if (transaction.type !== 'WITHDRAWAL') {
      throw new NotAWithdrawalTransaction();
    }

    if (transaction.status !== 'PENDING') {
      throw new TransactionNotInPendingException();
    }

    await this.prismaService.$transaction(async (tx) => {
      await this.transactionRepository.update(
        {
          id,
        },
        {
          status: 'CANCEL',
        },
        tx,
      );
      await this.withdrawalTransactionRepository.update(
        {
          id: transaction.withdrawalTransaction.id,
        },
        {
          failReason: denyDto.failReason,
        },
        tx,
      );
    });

    await this.notificationService.addNotificationToQueue({
      userId: transaction.userId,
      type: 'BOTH_INAPP_EMAIL',
      title: 'Rút tiền thất bại',
      content: `Yêu cầu rút tiền thất bại với lí do ${denyDto.failReason}`,
      payload: {
        id: transaction.id,
      },
      referenceType: 'FAIL_WITHDRAWAL',
    });
  }

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
