jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Prisma, Transaction } from '@prisma/client';
import * as QRCode from 'qrcode';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { DepositTransactionRepository } from 'src/database/repositories/deposit-transaction.repository';
import { PrismaService } from 'src/prisma.service';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { CreateWithdrawalResponseDto } from 'src/user/dtos/rest/create-withdrawal.response.dto';
import { CreateDepositResponseDto } from 'src/user/dtos/rest/create-deposit.response.dto';
import { TransactionDto } from 'src/user/dtos/transaction.dto';
import { WalletDto } from 'src/user/dtos/wallet.dto';
import { SepayService } from './sepay.service';
import { TransactionHandlerService } from './transaction-handler.service';
import { ExistPendingWithdrawalException } from '../exceptions/exist-pending-withdrawal.exception';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';
import { TransactionNotInPendingException } from '../exceptions/transaction-not-in-pending.exception';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { SepayRequestDto } from '../dtos/sepay.request.dto';

describe('SepayService', () => {
  let service: SepayService;

  const transactionRepository = {
    countAll: jest.fn(),
    findAll: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const withdrawalTransactionRepository = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const depositTransactionRepository = { create: jest.fn() };
  const transactionHandlerService = {
    handleUpgradeToPhotographer: jest.fn(),
    handleDeposit: jest.fn(),
    handleWithdrawal: jest.fn(),
    handleBuy: jest.fn(),
  };
  const tx = { tx: true };
  const prisma = { $transaction: jest.fn() };
  const toDataURL = QRCode.toDataURL as unknown as jest.Mock;

  const makeTransaction = (
    overrides: Partial<Transaction> & Record<string, unknown> = {},
  ): Transaction =>
    ({
      id: 'tr-1',
      userId: 'user-1',
      paymentPayload: {},
      paymentMethod: 'SEPAY',
      type: 'DEPOSIT',
      status: 'SUCCESS',
      amount: new Prisma.Decimal(1000),
      fee: new Prisma.Decimal(0),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides,
    }) as Transaction;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    prisma.$transaction.mockImplementation(
      (cb: (client: unknown) => Promise<unknown>) => cb(tx),
    );
    process.env.SEPAY_ACC = 'ACC';
    process.env.SEPAY_BANK = 'BANK';
    process.env.BACKEND_ORIGIN = 'http://backend';

    const moduleRef = await Test.createTestingModule({
      providers: [
        SepayService,
        { provide: TransactionRepository, useValue: transactionRepository },
        {
          provide: WithdrawalTransactionRepository,
          useValue: withdrawalTransactionRepository,
        },
        {
          provide: DepositTransactionRepository,
          useValue: depositTransactionRepository,
        },
        {
          provide: TransactionHandlerService,
          useValue: transactionHandlerService,
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SepayService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createWithdrawal', () => {
    const createWithdrawal = {
      amount: 50000,
      bankName: 'VCB',
      bankNumber: '0123',
      bankUsername: 'NGUYEN VAN A',
    };

    it('should throw NotEnoughBalanceException when wallet balance is lower than amount', async () => {
      jest
        .spyOn(service, 'getWalletByUserId')
        .mockResolvedValue(new WalletDto(1000));

      await expect(
        service.createWithdrawal('user-1', createWithdrawal),
      ).rejects.toThrow(NotEnoughBalanceException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ExistPendingWithdrawalException when a pending withdrawal exists', async () => {
      jest
        .spyOn(service, 'getWalletByUserId')
        .mockResolvedValue(new WalletDto(100000));
      withdrawalTransactionRepository.findFirst.mockResolvedValue({
        id: 'pending',
      });

      await expect(
        service.createWithdrawal('user-1', createWithdrawal),
      ).rejects.toThrow(ExistPendingWithdrawalException);
      expect(withdrawalTransactionRepository.findFirst).toHaveBeenCalledWith(
        { userId: 'user-1', type: 'WITHDRAWAL', status: 'PENDING' },
        tx,
      );
      expect(withdrawalTransactionRepository.create).not.toHaveBeenCalled();
    });

    it('should create a withdrawal transaction', async () => {
      jest
        .spyOn(service, 'getWalletByUserId')
        .mockResolvedValue(new WalletDto(100000));
      withdrawalTransactionRepository.findFirst.mockResolvedValue(null);
      withdrawalTransactionRepository.create.mockResolvedValue({ id: 'wd-1' });

      const result = await service.createWithdrawal('user-1', createWithdrawal);

      expect(result).toBeInstanceOf(CreateWithdrawalResponseDto);
      expect(result.transactionId).toBe('wd-1');
      expect(withdrawalTransactionRepository.create).toHaveBeenCalledWith(
        'user-1',
        50000,
        'VCB',
        '0123',
        'NGUYEN VAN A',
        tx,
      );
    });
  });

  describe('createDeposit', () => {
    it('should create deposit transaction and return payment url and qr code', async () => {
      depositTransactionRepository.create.mockResolvedValue({
        id: 'aaaa-bbbb',
      });
      toDataURL.mockResolvedValue('data:image/png;base64,xyz');

      const result = await service.createDeposit('user-1', { amount: 20000 });

      expect(depositTransactionRepository.create).toHaveBeenCalledWith(
        'user-1',
        20000,
        'SEPAY',
      );
      expect(result).toBeInstanceOf(CreateDepositResponseDto);
      expect(result.transactionId).toBe('aaaa-bbbb');
      expect(result.testQRCode).toBe('data:image/png;base64,xyz');
      expect(result.paymentUrl).toBe(
        'https://qr.sepay.vn/img?acc=ACC&bank=BANK&amount=20000&des=PXLaaaaLXPbbbbPXL&template=TEMPLATE',
      );
      expect(toDataURL).toHaveBeenCalledWith(
        'http://backend/ipn/sepay/test?transactionid=aaaa-bbbb&amount=20000',
      );
    });
  });

  describe('findAllTransactionByUserId', () => {
    it('should return paginated transactions of user', async () => {
      const findAllDto = Object.assign(new FindAllTransactionDto(), {
        limit: 10,
        page: 1,
        orderByAmount: 'desc',
      });
      transactionRepository.countAll.mockResolvedValue(25);
      transactionRepository.findAll.mockResolvedValue([makeTransaction()]);

      const result = await service.findAllTransactionByUserId(
        'user-1',
        findAllDto,
        '/transactions?orderByAmount=desc',
      );

      expect(transactionRepository.countAll).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(transactionRepository.findAll).toHaveBeenCalledWith(
        { userId: 'user-1' },
        10,
        10,
        expect.any(Array),
      );
      expect(result.totalRecord).toBe(25);
      expect(result.totalPage).toBe(3);
      expect(result.objects[0]).toBeInstanceOf(TransactionDto);
      expect(result.objects[0].amount).toBe(1000);
    });
  });

  describe('validateWalletBalanceIsEnough', () => {
    it('should throw NotEnoughBalanceException when balance is not enough', async () => {
      jest
        .spyOn(service, 'getWalletByUserId')
        .mockResolvedValue(new WalletDto(10));

      await expect(
        service.validateWalletBalanceIsEnough('user-1', 100),
      ).rejects.toThrow(NotEnoughBalanceException);
    });

    it('should resolve when balance is enough', async () => {
      jest
        .spyOn(service, 'getWalletByUserId')
        .mockResolvedValue(new WalletDto(100));

      await expect(
        service.validateWalletBalanceIsEnough('user-1', 100),
      ).resolves.toBeUndefined();
    });
  });

  describe('calculateWalletFromTransactions', () => {
    const cases: [string, Partial<Transaction>, number][] = [
      [
        'pending withdrawal decreases',
        { status: 'PENDING', type: 'WITHDRAWAL' },
        -1000,
      ],
      ['pending deposit is ignored', { status: 'PENDING', type: 'DEPOSIT' }, 0],
      ['failed deposit is ignored', { status: 'FAILED', type: 'DEPOSIT' }, 0],
      ['success deposit increases', { type: 'DEPOSIT' }, 1000],
      [
        'wallet image buy decreases',
        { type: 'IMAGE_BUY', paymentMethod: 'WALLET' },
        -1000,
      ],
      [
        'sepay image buy is ignored',
        { type: 'IMAGE_BUY', paymentMethod: 'SEPAY' },
        0,
      ],
      [
        'image sell increases amount minus fee',
        { type: 'IMAGE_SELL', fee: new Prisma.Decimal(100) },
        900,
      ],
      ['success withdrawal decreases', { type: 'WITHDRAWAL' }, -1000],
      ['refund increases', { type: 'REFUND_FROM_BUY_IMAGE' }, 1000],
      [
        'wallet upgrade decreases',
        { type: 'UPGRADE_TO_PHOTOGRAPHER', paymentMethod: 'WALLET' },
        -1000,
      ],
      [
        'sepay upgrade is ignored',
        { type: 'UPGRADE_TO_PHOTOGRAPHER', paymentMethod: 'SEPAY' },
        0,
      ],
    ];

    it.each(cases)('%s', async (_name, overrides, expected) => {
      const result = await service.calculateWalletFromTransactions([
        makeTransaction(overrides),
      ]);

      expect(result.toNumber()).toBe(expected);
    });

    it('should sum multiple transactions', async () => {
      const result = await service.calculateWalletFromTransactions([
        makeTransaction({ type: 'DEPOSIT', amount: new Prisma.Decimal(5000) }),
        makeTransaction({ type: 'IMAGE_BUY', paymentMethod: 'WALLET' }),
        makeTransaction({ type: 'WITHDRAWAL', status: 'PENDING' }),
      ]);

      expect(result.toNumber()).toBe(3000);
    });
  });

  describe('getWalletByUserId', () => {
    it('should calculate wallet from all user transactions', async () => {
      transactionRepository.findAll.mockResolvedValue([
        makeTransaction({ amount: new Prisma.Decimal(7000) }),
      ]);

      const result = await service.getWalletByUserId('user-1');

      expect(transactionRepository.findAll).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(result).toBeInstanceOf(WalletDto);
      expect(result.walletBalance).toBe(7000);
    });
  });

  describe('processTransaction', () => {
    const makeSepay = (transferAmount = 1000) =>
      Object.assign(new SepayRequestDto(), {
        content: '74135542559-PXL5DCBB72ALXPE1D5PXL-CHUYEN TIEN',
        transferAmount,
      });

    it('should parse transaction id from content', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'PENDING', type: 'DEPOSIT' }),
      );

      await service.processTransaction(makeSepay());

      expect(transactionRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: '5dcbb72a-e1d5',
      });
    });

    it('should throw TransactionNotFoundException when transaction is null', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(null);

      await expect(service.processTransaction(makeSepay())).rejects.toThrow(
        TransactionNotFoundException,
      );
    });

    it('should return the transaction when it is already success', async () => {
      const transaction = makeTransaction({ status: 'SUCCESS' });
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);

      await expect(service.processTransaction(makeSepay())).resolves.toBe(
        transaction,
      );
    });

    it('should return the transaction when it is not pending', async () => {
      const transaction = makeTransaction({ status: 'EXPIRED' });
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);

      await expect(service.processTransaction(makeSepay())).resolves.toBe(
        transaction,
      );
      expect(transactionHandlerService.handleDeposit).not.toHaveBeenCalled();
    });

    it('should throw AmountIsNotEqualException when amount differs', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'PENDING' }),
      );

      await expect(service.processTransaction(makeSepay(999))).rejects.toThrow(
        AmountIsNotEqualException,
      );
    });

    it('should throw TransactionNotFoundException when upgrade transaction has no service transaction', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({
          status: 'PENDING',
          type: 'UPGRADE_TO_PHOTOGRAPHER',
          serviceTransaction: null,
        }),
      );

      await expect(service.processTransaction(makeSepay())).rejects.toThrow(
        TransactionNotFoundException,
      );
    });

    it('should handle upgrade to photographer', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({
          status: 'PENDING',
          type: 'UPGRADE_TO_PHOTOGRAPHER',
          serviceTransaction: { id: 'st-1' },
        }),
      );
      const sepay = makeSepay();

      await expect(service.processTransaction(sepay)).resolves.toBe(
        HttpStatus.OK,
      );
      expect(
        transactionHandlerService.handleUpgradeToPhotographer,
      ).toHaveBeenCalledWith('user-1', 'st-1', sepay);
    });

    it('should handle deposit', async () => {
      const transaction = makeTransaction({
        status: 'PENDING',
        type: 'DEPOSIT',
      });
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);
      const sepay = makeSepay();

      await expect(service.processTransaction(sepay)).resolves.toBe(
        HttpStatus.OK,
      );
      expect(transactionHandlerService.handleDeposit).toHaveBeenCalledWith(
        transaction,
        sepay,
      );
    });

    it('should handle withdrawal', async () => {
      const transaction = makeTransaction({
        status: 'PENDING',
        type: 'WITHDRAWAL',
      });
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);
      const sepay = makeSepay();

      await expect(service.processTransaction(sepay)).resolves.toBe(
        HttpStatus.OK,
      );
      expect(transactionHandlerService.handleWithdrawal).toHaveBeenCalledWith(
        transaction,
        sepay,
      );
    });

    it('should do nothing for image sell', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'PENDING', type: 'IMAGE_SELL' }),
      );

      await expect(service.processTransaction(makeSepay())).resolves.toBe(
        HttpStatus.OK,
      );
      expect(transactionHandlerService.handleBuy).not.toHaveBeenCalled();
    });

    it('should do nothing for unhandled transaction type', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'PENDING', type: 'REFUND_FROM_BUY_IMAGE' }),
      );

      await expect(service.processTransaction(makeSepay())).resolves.toBe(
        HttpStatus.OK,
      );
    });

    it('should throw TransactionNotFoundException when image buy has no from user transaction', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({
          status: 'PENDING',
          type: 'IMAGE_BUY',
          fromUserTransaction: null,
        }),
      );

      await expect(service.processTransaction(makeSepay())).rejects.toThrow(
        TransactionNotFoundException,
      );
    });

    it('should handle image buy', async () => {
      const transaction = makeTransaction({
        status: 'PENDING',
        type: 'IMAGE_BUY',
        fromUserTransaction: { id: 'utu-1' },
      });
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);
      const sepay = makeSepay();

      await expect(service.processTransaction(sepay)).resolves.toBe(
        HttpStatus.OK,
      );
      expect(transactionHandlerService.handleBuy).toHaveBeenCalledWith(
        transaction,
        'utu-1',
        sepay,
      );
    });
  });

  describe('generatePayment', () => {
    it('should throw TransactionNotInPendingException when transaction is not pending', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'SUCCESS' }),
      );

      await expect(service.generatePayment('tr-1', 1000)).rejects.toThrow(
        TransactionNotInPendingException,
      );
    });

    it('should return payment url and mock qr code', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'PENDING' }),
      );
      toDataURL.mockResolvedValue('qr');

      const result = await service.generatePayment(' ab-cd ', 1000);

      expect(transactionRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: ' ab-cd ',
      });
      expect(result).toEqual({
        mockQrCode: 'qr',
        paymentUrl:
          'https://qr.sepay.vn/img?acc=ACC&bank=BANK&amount=1000&des=PXLabLXPcdPXL&template=TEMPLATE',
      });
    });
  });
});
