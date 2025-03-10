import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';

import * as QRCode from 'qrcode';
import { Transaction } from '@prisma/client';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { CreateDepositRequestDto } from 'src/user/dtos/rest/create-deposit.request.dto';
import { CreateDepositResponseDto } from 'src/user/dtos/rest/create-deposit.response.dto';
import { CreateWithdrawalRequestDto } from 'src/user/dtos/rest/create-withdrawal.request.dto';
import { CreateWithdrawalResponseDto } from 'src/user/dtos/rest/create-withdrawal.response.dto';
import { TransactionDto } from 'src/user/dtos/transaction.dto';
import { FindAllTransactionDto } from 'src/payment/dtos/rest/find-all-transaction.dto';
import { WalletDto } from 'src/user/dtos/wallet.dto';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { DepositTransactionRepository } from 'src/database/repositories/deposit-transaction.repository';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';

import { PaymentUrlDto } from '../dtos/payment-url.dto';
import { TransactionNotInPendingException } from '../exceptions/transaction-not-in-pending.exception';
import { TransactionHandlerService } from './transaction-handler.service';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentConstant } from '../constants/payment-constant';
import { ExistPendingWithdrawalException } from '../exceptions/exist-pending-withdrawal.exception';

@Injectable()
export class SepayService {
  constructor(
    @Inject()
    private readonly transactionRepository: TransactionRepository,
    @Inject()
    private readonly withdrawalTransactionRepository: WithdrawalTransactionRepository,
    @Inject()
    private readonly depositTransactionRepository: DepositTransactionRepository,

    @Inject()
    private readonly transactionHandlerService: TransactionHandlerService,
    private readonly prisma: PrismaService,
  ) {}

  async createWithdrawal(
    userId: string,
    createWithdrawal: CreateWithdrawalRequestDto,
  ) {
    const walletDto = await this.getWalletByUserId(userId);

    if (walletDto.walletBalance < createWithdrawal.amount) {
      throw new NotEnoughBalanceException();
    }

    return await this.prisma.$transaction(async (tx) => {
      const existWithdrawalTransaction =
        await this.withdrawalTransactionRepository.findFirst(
          {
            userId,
            type: 'WITHDRAWAL',
            status: 'PENDING',
          },
          tx,
        );

      if (existWithdrawalTransaction) {
        throw new ExistPendingWithdrawalException();
      }

      const withdrawalTransaction =
        await this.withdrawalTransactionRepository.create(
          userId,
          createWithdrawal.amount,
          createWithdrawal.bankName,
          createWithdrawal.bankNumber,
          createWithdrawal.bankUsername,
          tx,
        );

      return new CreateWithdrawalResponseDto(withdrawalTransaction.id);
    });
  }

  async createDeposit(
    userId: string,
    createDepositDto: CreateDepositRequestDto,
  ) {
    const transaction = await this.depositTransactionRepository.create(
      userId,
      createDepositDto.amount,
      'SEPAY',
    );

    const paymentUrl = this.generatePaymentUrl(
      transaction.id,
      createDepositDto.amount,
    );

    const mockQrcode = await this.generateMockIpnQrCode(
      transaction.id,
      createDepositDto.amount,
    );

    return new CreateDepositResponseDto(paymentUrl, mockQrcode, transaction.id);
  }

  async findAllTransactionByUserId(
    userId: string,
    findAllTransactionDto: FindAllTransactionDto,
    query: string,
  ): Promise<PagingPaginatedResposneDto<TransactionDto>> {
    const where = findAllTransactionDto.toWhere();
    where.userId = userId;

    const count = await this.transactionRepository.countAll(where);
    const transactions = await this.transactionRepository.findAll(
      where,
      findAllTransactionDto.toSkip(),
      findAllTransactionDto.limit,
      findAllTransactionDto.toOrderBy(query),
    );

    const transactionDtos = plainToInstance(TransactionDto, transactions);

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllTransactionDto.limit,
      count,
      transactionDtos,
    );

    return response;
  }

  async validateWalletBalanceIsEnough(userId: string, amount: number) {
    const userWallet = await this.getWalletByUserId(userId);

    if (userWallet.walletBalance < amount) {
      throw new NotEnoughBalanceException();
    }
  }

  async calculateWalletFromTransactions(transactions: Transaction[]) {
    const walletBalance = transactions.reduce(
      (acc: Decimal, t: Transaction) => {
        //only process success transaction
        if (t.status !== 'SUCCESS') {
          //this is exception case
          if (t.status === 'PENDING' && t.type === 'WITHDRAWAL') {
            return acc.sub(t.amount);
          }

          return acc;
        }

        switch (t.type) {
          case 'DEPOSIT':
            console.log(`1 increases ${t.amount}`);
            return acc.add(t.amount);

          case 'IMAGE_BUY':
            if (t.paymentMethod === 'WALLET') {
              console.log(`2 decrease ${t.amount}`);
              return acc.sub(t.amount);
            }

          case 'IMAGE_SELL':
            if (t.type === 'IMAGE_BUY') {
              return acc;
            }
            console.log(`3 increase ${t.amount}`);
            return acc.add(t.amount).sub(t.fee);

          case 'WITHDRAWAL':
            console.log(`4 decrease ${t.amount}`);
            return acc.sub(t.amount);

          case 'REFUND_FROM_BUY_IMAGE':
            console.log(`5 increase ${t.amount}`);
            return acc.add(t.amount);

          case 'UPGRADE_TO_PHOTOGRAPHER':
            if (t.paymentMethod === 'WALLET') {
              console.log(`6 decreaes ${t.amount}`);
              return acc.sub(t.amount);
            }

          default:
            return acc;
        }
      },
      new Decimal(0),
    );

    return walletBalance;
  }

  async getWalletByUserId(userId: string): Promise<WalletDto> {
    const transactions = await this.transactionRepository.findAll({
      userId,
    });

    const walletBalance =
      await this.calculateWalletFromTransactions(transactions);
    const walletDto = new WalletDto(walletBalance.toNumber());

    return walletDto;
  }

  async processTransaction(sepay: SepayRequestDto) {
    //MOMO case
    //74135542559-5dcbb72a e1d5 47c5 959e0f9efe633b5d-CHUYEN TIEN-OQCH38888204-MOMO74135542559MOMO

    const startIndex = sepay.content.indexOf(PaymentConstant.PAYMENT_MARK);
    const lastIndex = sepay.content.lastIndexOf(PaymentConstant.PAYMENT_MARK);

    const id = sepay.content
      .substring(startIndex + PaymentConstant.PAYMENT_MARK.length, lastIndex)
      .replaceAll(PaymentConstant.PAYMENT_SEPERATOR, '-')
      .toLowerCase();

    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id,
    });

    if (transaction == null) {
      throw new TransactionNotFoundException();
    }

    if (transaction.status === 'SUCCESS' || transaction.status !== 'PENDING') {
      return transaction;
    }

    if (transaction.amount.toNumber() != sepay.transferAmount) {
      throw new AmountIsNotEqualException();
    }

    switch (transaction.type) {
      case 'UPGRADE_TO_PHOTOGRAPHER':
        await this.transactionHandlerService.handleUpgradeToPhotographer(
          transaction.userId,
          transaction.serviceTransaction.id,
          sepay,
        );
        break;
      case 'DEPOSIT':
        await this.transactionHandlerService.handleDeposit(transaction, sepay);
        break;
      case 'WITHDRAWAL':
        await this.transactionHandlerService.handleWithdrawal(
          transaction,
          sepay,
        );
        break;
      case 'IMAGE_SELL':
        break;
      case 'IMAGE_BUY':
        await this.transactionHandlerService.handleBuy(
          transaction,
          transaction.fromUserTransaction.id,
          sepay,
        );
        break;
    }

    return HttpStatus.OK;
  }

  async generatePayment(
    transactionId: string,
    amount: number,
  ): Promise<PaymentUrlDto> {
    const transaction = await this.transactionRepository.findUniqueOrThrow({
      id: transactionId,
    });

    if (transaction.status !== 'PENDING') {
      throw new TransactionNotInPendingException();
    }

    const url = this.generatePaymentUrl(transactionId, amount);

    const qrcode = await this.generateMockIpnQrCode(transactionId, amount);

    return {
      mockQrCode: qrcode,
      paymentUrl: url,
    };
  }

  generatePaymentUrl(transactionId: string, amount: number) {
    const removedDashTransactionId = `${PaymentConstant.PAYMENT_MARK}${transactionId.trim().replaceAll('-', PaymentConstant.PAYMENT_SEPERATOR)}${PaymentConstant.PAYMENT_MARK}`;

    return `https://qr.sepay.vn/img?acc=${process.env.SEPAY_ACC}&bank=${process.env.SEPAY_BANK}&amount=${amount}&des=${encodeURIComponent(removedDashTransactionId)}&template=TEMPLATE`;
  }

  async generateMockIpnQrCode(
    transactionId: string,
    amount: number,
  ): Promise<string> {
    return await QRCode.toDataURL(
      `${process.env.BACKEND_ORIGIN}/ipn/sepay/test?transactionid=${transactionId}&amount=${amount}`,
    );
  }
}
