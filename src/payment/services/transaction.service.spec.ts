import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { MemoryStoredFile } from 'nestjs-form-data';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { WithdrawalTransactionRepository } from 'src/database/repositories/withdrawal-transaction.repository';
import { BunnyService } from 'src/storage/services/bunny.service';
import { NotificationService } from 'src/notification/services/notification.service';
import { PrismaService } from 'src/prisma.service';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { WalletDto } from 'src/user/dtos/wallet.dto';
import { TransactionService } from './transaction.service';
import { SepayService } from './sepay.service';
import { NotAWithdrawalTransaction } from '../exceptions/not-a-withdrawal-transaction.exception';
import { TransactionNotInPendingException } from '../exceptions/transaction-not-in-pending.exception';
import { AcceptWithdrawalTransactionDto } from '../dtos/rest/accept-withdrawal-transaction.dto';
import { DenyWithdrawalTransactionDto } from '../dtos/rest/deny-withdrawal-transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { TransactionDto } from '../dtos/transaction.dto';

describe('TransactionService', () => {
  let service: TransactionService;

  const transactionRepository = {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    countAll: jest.fn(),
    findAll: jest.fn(),
  };
  const withdrawalTransactionRepository = { update: jest.fn() };
  const sepayService = {
    getWalletByUserId: jest.fn(),
    generatePayment: jest.fn(),
  };
  const bunnyService = { uploadPublicFromBuffer: jest.fn() };
  const notificationService = { addNotificationToQueue: jest.fn() };
  const tx = { tx: true };
  const prismaService = { $transaction: jest.fn() };

  const makeTransaction = (overrides: Record<string, unknown> = {}) => ({
    id: 'tr-1',
    userId: 'user-1',
    type: 'WITHDRAWAL',
    status: 'PENDING',
    paymentMethod: 'WALLET',
    amount: new Prisma.Decimal(50000),
    fee: new Prisma.Decimal(0),
    withdrawalTransaction: { id: 'wd-1' },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  const acceptDto = (): AcceptWithdrawalTransactionDto => {
    const dto = new AcceptWithdrawalTransactionDto();
    dto.photo = new MemoryStoredFile();
    dto.photo.buffer = Buffer.from('photo');
    return dto;
  };

  const denyDto = (): DenyWithdrawalTransactionDto =>
    Object.assign(new DenyWithdrawalTransactionDto(), {
      failReason: 'wrong bank number',
    });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    prismaService.$transaction.mockImplementation(
      (cb: (client: unknown) => Promise<unknown>) => cb(tx),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: TransactionRepository, useValue: transactionRepository },
        {
          provide: WithdrawalTransactionRepository,
          useValue: withdrawalTransactionRepository,
        },
        { provide: SepayService, useValue: sepayService },
        { provide: BunnyService, useValue: bunnyService },
        { provide: NotificationService, useValue: notificationService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = moduleRef.get(TransactionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('acceptWithdrawal', () => {
    it('should throw NotAWithdrawalTransaction when transaction is not a withdrawal', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ type: 'DEPOSIT' }),
      );

      await expect(
        service.acceptWithdrawal('tr-1', acceptDto()),
      ).rejects.toThrow(NotAWithdrawalTransaction);
      expect(bunnyService.uploadPublicFromBuffer).not.toHaveBeenCalled();
    });

    it('should throw TransactionNotInPendingException when transaction is not pending', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'SUCCESS' }),
      );

      await expect(
        service.acceptWithdrawal('tr-1', acceptDto()),
      ).rejects.toThrow(TransactionNotInPendingException);
    });

    it('should throw NotAWithdrawalTransaction when withdrawal relation is missing', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ withdrawalTransaction: null }),
      );
      bunnyService.uploadPublicFromBuffer.mockResolvedValue('https://photo');

      await expect(
        service.acceptWithdrawal('tr-1', acceptDto()),
      ).rejects.toThrow(NotAWithdrawalTransaction);
      expect(withdrawalTransactionRepository.update).not.toHaveBeenCalled();
      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
    });

    it('should mark transaction success, save photo and notify user', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      bunnyService.uploadPublicFromBuffer.mockResolvedValue('https://photo');
      const dto = acceptDto();

      await service.acceptWithdrawal('tr-1', dto);

      expect(transactionRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'tr-1',
      });
      expect(bunnyService.uploadPublicFromBuffer).toHaveBeenCalledWith(
        dto.photo.buffer,
        'tr-1.webp',
      );
      expect(transactionRepository.update).toHaveBeenCalledWith(
        { id: 'tr-1' },
        { status: 'SUCCESS' },
        tx,
      );
      expect(withdrawalTransactionRepository.update).toHaveBeenCalledWith(
        { id: 'wd-1' },
        { successPhotoUrl: 'https://photo' },
        tx,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          referenceType: 'SUCCESS_WITHDRAWAL',
          payload: { id: 'tr-1' },
        }),
      );
    });
  });

  describe('denyWithdrawal', () => {
    it('should throw NotAWithdrawalTransaction when transaction is not a withdrawal', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ type: 'IMAGE_BUY' }),
      );

      await expect(service.denyWithdrawal('tr-1', denyDto())).rejects.toThrow(
        NotAWithdrawalTransaction,
      );
    });

    it('should throw TransactionNotInPendingException when transaction is not pending', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'EXPIRED' }),
      );

      await expect(service.denyWithdrawal('tr-1', denyDto())).rejects.toThrow(
        TransactionNotInPendingException,
      );
    });

    it('should throw NotAWithdrawalTransaction when withdrawal relation is missing', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ withdrawalTransaction: null }),
      );

      await expect(service.denyWithdrawal('tr-1', denyDto())).rejects.toThrow(
        NotAWithdrawalTransaction,
      );
      expect(withdrawalTransactionRepository.update).not.toHaveBeenCalled();
    });

    it('should cancel transaction, store fail reason and notify user', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );

      await service.denyWithdrawal('tr-1', denyDto());

      expect(transactionRepository.update).toHaveBeenCalledWith(
        { id: 'tr-1' },
        { status: 'CANCEL' },
        tx,
      );
      expect(withdrawalTransactionRepository.update).toHaveBeenCalledWith(
        { id: 'wd-1' },
        { failReason: 'wrong bank number' },
        tx,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          referenceType: 'FAIL_WITHDRAWAL',
          content: 'Yêu cầu rút tiền thất bại với lí do wrong bank number',
        }),
      );
    });
  });

  describe('update', () => {
    it('should throw TransactionNotInPendingException when transaction is not pending', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction({ status: 'SUCCESS' }),
      );

      await expect(
        service.update('tr-1', { status: 'SUCCESS' }),
      ).rejects.toThrow(TransactionNotInPendingException);
    });

    it('should throw NotEnoughBalanceException when marking success with insufficient wallet', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      sepayService.getWalletByUserId.mockResolvedValue(new WalletDto(100));

      await expect(
        service.update('tr-1', { status: 'SUCCESS' }),
      ).rejects.toThrow(NotEnoughBalanceException);
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('should update status to success when wallet is enough', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      sepayService.getWalletByUserId.mockResolvedValue(new WalletDto(50000));

      await service.update('tr-1', { status: 'SUCCESS' });

      expect(sepayService.getWalletByUserId).toHaveBeenCalledWith('user-1');
      expect(transactionRepository.update).toHaveBeenCalledWith(
        { id: 'tr-1' },
        { status: 'SUCCESS' },
      );
    });

    it('should update to non-success status regardless of wallet', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      sepayService.getWalletByUserId.mockResolvedValue(new WalletDto(0));

      await service.update('tr-1', { status: 'CANCEL' });

      expect(transactionRepository.update).toHaveBeenCalledWith(
        { id: 'tr-1' },
        { status: 'CANCEL' },
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions with wallets', async () => {
      const findAllDto = Object.assign(new FindAllTransactionDto(), {
        limit: 5,
        page: 0,
        statuses: ['PENDING'],
      });
      transactionRepository.countAll.mockResolvedValue(6);
      transactionRepository.findAll.mockResolvedValue([
        makeTransaction({ id: 'tr-1', userId: 'user-1' }),
        makeTransaction({ id: 'tr-2', userId: 'user-2' }),
      ]);
      sepayService.getWalletByUserId.mockImplementation(
        async (userId) => new WalletDto(userId === 'user-1' ? 10 : 20),
      );

      const result = await service.findAll(findAllDto, '/transaction');

      expect(transactionRepository.countAll).toHaveBeenCalledWith({
        status: { in: ['PENDING'] },
      });
      expect(transactionRepository.findAll).toHaveBeenCalledWith(
        { status: { in: ['PENDING'] } },
        0,
        5,
        expect.any(Array),
      );
      expect(result.totalRecord).toBe(6);
      expect(result.totalPage).toBe(2);
      expect(result.objects).toHaveLength(2);
      expect(result.objects[0]).toBeInstanceOf(TransactionDto);
      expect(result.objects[0].wallet.walletBalance).toBe(10);
      expect(result.objects[1].wallet.walletBalance).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return transaction dto with wallet', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      sepayService.getWalletByUserId.mockResolvedValue(new WalletDto(99));

      const result = await service.findById('tr-1');

      expect(result).toBeInstanceOf(TransactionDto);
      expect(result.amount).toBe(50000);
      expect(result.wallet.walletBalance).toBe(99);
    });
  });

  describe('findByUserIdAndId', () => {
    it('should find transaction by user id and id', async () => {
      const transaction = makeTransaction();
      transactionRepository.findUniqueOrThrow.mockResolvedValue(transaction);

      await expect(service.findByUserIdAndId('user-1', 'tr-1')).resolves.toBe(
        transaction,
      );
      expect(transactionRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'tr-1',
        userId: 'user-1',
      });
    });
  });

  describe('generatePaymentUrl', () => {
    it('should generate payment of the user transaction', async () => {
      transactionRepository.findUniqueOrThrow.mockResolvedValue(
        makeTransaction(),
      );
      sepayService.generatePayment.mockResolvedValue({
        paymentUrl: 'url',
        mockQrCode: 'qr',
      });

      await expect(
        service.generatePaymentUrl('user-1', 'tr-1'),
      ).resolves.toEqual({ paymentUrl: 'url', mockQrCode: 'qr' });
      expect(transactionRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'tr-1',
        userId: 'user-1',
      });
      expect(sepayService.generatePayment).toHaveBeenCalledWith('tr-1', 50000);
    });
  });
});
