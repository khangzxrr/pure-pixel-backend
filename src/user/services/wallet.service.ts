import { Inject, Injectable } from '@nestjs/common';
import { WalletDto } from '../dtos/wallet.dto';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { Transaction } from '@prisma/client';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { CreateDepositRequestDto } from '../dtos/rest/create-deposit.request.dto';
import { DepositTransactionRepository } from 'src/database/repositories/deposit-transaction.repository';
import { SepayService } from 'src/payment/services/sepay.service';
import { CreateDepositResponseDto } from '../dtos/rest/create-deposit.response.dto';
import { CreateWithdrawalRequestDto } from '../dtos/rest/create-withdrawal.request.dto';
import { NotEnoughBalanceException } from '../exceptions/not-enought-balance.exception';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { PrismaService } from 'src/prisma.service';
import { CreateWithdrawalResponseDto } from '../dtos/rest/create-withdrawal.response.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class WalletService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject()
    private readonly depositTransactionRepository: DepositTransactionRepository,
    @Inject() private readonly sepayService: SepayService,
    @Inject()
    private readonly withdrawalTransactionRepository: WithdrawalTransactionRepository,
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

    const paymentUrl = this.sepayService.generatePaymentUrl(
      createDepositDto.amount,
      transaction.id,
    );

    const mockQrcode = await this.sepayService.generateMockIpnQrCode(
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
    const transactions = await this.transactionRepository.findAll(where, [
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
    ]);

    const transactionDtos = transactions.map((t) => new TransactionDto(t));

    const response = new PagingPaginatedResposneDto<TransactionDto>(
      findAllTransactionDto.limit,
      count,
      transactionDtos,
    );

    return response;
  }

  async getWalletByUserId(userId: string): Promise<WalletDto> {
    const cachedWalletDto = await this.cacheManager.get<WalletDto>(
      `walletdto:${userId}`,
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
          if (t.paymentMethod == 'WALLET') {
            return acc - t.amount.toNumber();
          }
          break;

        case 'IMAGE_SELL':
          if (t.paymentMethod == 'WALLET') {
            return acc + t.amount.toNumber();
          }
          break;

        case 'WITHDRAWAL':
          return acc - t.amount.toNumber();

        case 'UPGRADE_TO_PHOTOGRAPHER':
          if (t.paymentMethod == 'WALLET') {
            return acc - t.amount.toNumber();
          }
          break;

        default:
          return acc;
      }

      return acc;
    }, 0);

    const walletDto = new WalletDto(walletBalance);

    await this.cacheManager.set(`walletdto:${userId}`, walletDto);

    return walletDto;
  }
}
