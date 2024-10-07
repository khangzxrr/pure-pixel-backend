import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { DatabaseService } from 'src/database/database.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ServiceTransactionRepository } from 'src/database/repositories/service-transaction.repository';

import * as QRCode from 'qrcode';
import { Transaction } from '@prisma/client';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { CreateDepositRequestDto } from 'src/user/dtos/rest/create-deposit.request.dto';
import { CreateDepositResponseDto } from 'src/user/dtos/rest/create-deposit.response.dto';
import { CreateWithdrawalRequestDto } from 'src/user/dtos/rest/create-withdrawal.request.dto';
import { CreateWithdrawalResponseDto } from 'src/user/dtos/rest/create-withdrawal.response.dto';
import { TransactionDto } from 'src/user/dtos/transaction.dto';
import { FindAllTransactionDto } from 'src/user/dtos/rest/find-all-transaction.dto';
import { WalletDto } from 'src/user/dtos/wallet.dto';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { DepositTransactionRepository } from 'src/database/repositories/deposit-transaction.repository';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';

@Injectable()
export class SepayService {
  constructor(
    @Inject()
    private readonly serviceTransactionRepository: ServiceTransactionRepository,
    @Inject()
    private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly databaseService: DatabaseService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly userToUserRepository: UserToUserRepository,
    @Inject()
    private readonly withdrawalTransactionRepository: WithdrawalTransactionRepository,
    @Inject()
    private readonly depositTransactionRepository: DepositTransactionRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    const cancelAllPreviousPendingWithdrawalTransactions =
      this.transactionRepository.cancelAllPendingTransactionByIdAndType(
        'WITHDRAWAL',
      );

    const createWithdrawalTransaction =
      this.withdrawalTransactionRepository.create(
        userId,
        createWithdrawal.amount,
        createWithdrawal.bankName,
        createWithdrawal.bankNumber,
        createWithdrawal.bankUsername,
      );

    const [, withdrawalTransaction] = await this.prisma.$transaction([
      cancelAllPreviousPendingWithdrawalTransactions,
      createWithdrawalTransaction,
    ]);

    return new CreateWithdrawalResponseDto(withdrawalTransaction.id);
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
  ): Promise<PagingPaginatedResposneDto<TransactionDto>> {
    console.log(findAllTransactionDto);

    const where = {
      type: findAllTransactionDto.type,
      status: findAllTransactionDto.status,
      userId,
    };

    const count = await this.transactionRepository.countAll(where);
    const transactions = await this.transactionRepository.findAll(
      where,
      findAllTransactionDto.toSkip(),
      findAllTransactionDto.limit,
      [
        {
          type: findAllTransactionDto.orderByType,
        },
        {
          amount: findAllTransactionDto.orderByAmount,
        },
        {
          createdAt: findAllTransactionDto.orderByCreatedAt,
        },
        {
          paymentMethod: findAllTransactionDto.orderByPaymentMethod,
        },
      ],
    );

    const transactionDtos = plainToInstance(TransactionDto, transactions);

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllTransactionDto.limit,
      count,
      transactionDtos,
    );

    return response;
  }

  async getWalletByUserId(userId: string): Promise<WalletDto> {
    //temporary disable caching
    const cachedWalletDto = await this.cacheManager.get<WalletDto>(
      `walletdto2:${userId}`,
    );

    if (cachedWalletDto) {
      return cachedWalletDto;
    }

    const transactions = await this.transactionRepository.findAll({
      userId,
    });

    const walletBalance = transactions.reduce((acc: number, t: Transaction) => {
      //only process success transaction
      if (t.status !== 'SUCCESS') {
        return acc;
      }

      switch (t.type) {
        case 'DEPOSIT':
          return acc + t.amount.toNumber();

        case 'IMAGE_BUY':
          return acc - t.amount.toNumber();

        case 'IMAGE_SELL':
          return acc + t.amount.toNumber() - t.fee.toNumber();

        case 'WITHDRAWAL':
          return acc - t.amount.toNumber();

        case 'UPGRADE_TO_PHOTOGRAPHER':
          return acc - t.amount.toNumber();

        default:
          return acc;
      }
    }, 0);

    const walletDto = new WalletDto(walletBalance);

    await this.cacheManager.set(`walletdto:${userId}`, walletDto);

    return walletDto;
  }

  async handleUpgradeToPhotographer(
    userId: string,
    serviceTransactionId: string,
    sepay: SepayRequestDto,
  ) {
    const serviceTransaction = await this.serviceTransactionRepository.findById(
      serviceTransactionId,
      true,
    );

    const updateTransactionAndUpgradeOrderQuery =
      this.serviceTransactionRepository.updateSuccessServiceTransactionAndActivateUpgradeOrder(
        serviceTransactionId,
        sepay,
      );

    const updateUserMaxQuotaQuery = this.userRepository.updateMaxQuotaByUserId(
      userId,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPhotoQuota,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPackageCount,
      serviceTransaction.upgradeOrder.upgradePackageHistory
        .maxBookingPhotoQuota,
      serviceTransaction.upgradeOrder.upgradePackageHistory
        .maxBookingVideoQuota,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      updateTransactionAndUpgradeOrderQuery,
      updateUserMaxQuotaQuery,
    ]);

    await this.keycloakService.addRoleToUser(
      userId,
      Constants.PHOTOGRAPHER_ROLE,
    );
  }

  async handleDeposit(transaction: Transaction, sepay: SepayRequestDto) {
    return await this.transactionRepository.updateStatusAndPayload(
      transaction.id,
      'SUCCESS',
      sepay,
    );
  }

  async handleWithdrawal(transaction: Transaction, sepay: SepayRequestDto) {
    return await this.transactionRepository.updateStatusAndPayload(
      transaction.id,
      'SUCCESS',
      sepay,
    );
  }

  async handleBuy(
    transaction: Transaction,
    fromUserTransactionId: string,
    sepay: SepayRequestDto,
  ) {
    const fromUserTransaction = await this.userToUserRepository.getById(
      fromUserTransactionId,
    );

    await this.userToUserRepository.markSucccessAndCreateToUserTransaction(
      fromUserTransactionId,
      sepay,
      fromUserTransaction.toUserId,
      transaction.fee,
      transaction.amount,
    );
  }

  async processTransaction(sepay: SepayRequestDto) {
    const transactionId = sepay.content.replaceAll(' ', '-');

    const transaction =
      await this.transactionRepository.findById(transactionId);

    if (transaction == null) {
      throw new TransactionNotFoundException();
    }

    if (transaction.status === 'SUCCESS' || transaction.status !== 'PENDING') {
      return transaction;
    }

    if (transaction.amount.toNumber() != sepay.transferAmount) {
      throw new AmountIsNotEqualException();
    }

    //clear wallet cache
    await this.cacheManager.del(`walletdto:${transaction.userId}`);

    switch (transaction.type) {
      case 'UPGRADE_TO_PHOTOGRAPHER':
        await this.handleUpgradeToPhotographer(
          transaction.userId,
          transaction.serviceTransaction.id,
          sepay,
        );
        break;
      case 'DEPOSIT':
        await this.handleDeposit(transaction, sepay);
        break;
      case 'WITHDRAWAL':
        await this.handleWithdrawal(transaction, sepay);
        break;
      case 'IMAGE_SELL':
        break;
      case 'IMAGE_BUY':
        await this.handleBuy(
          transaction,
          transaction.fromUserTransaction.id,
          sepay,
        );
        break;
    }

    return HttpStatus.OK;
  }

  generatePaymentUrl(transactionId: string, amount: number) {
    const removedDashTransactionId = transactionId.trim().replaceAll('-', ' ');

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
