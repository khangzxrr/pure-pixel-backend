import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PaymentMethod, Prisma } from '@prisma/client';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { SepayService } from 'src/payment/services/sepay.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { IdentityService } from 'src/authen/services/identity.service';
import { NotificationService } from 'src/notification/services/notification.service';
import { PrismaService } from 'src/prisma.service';
import { UpgradeConstant } from 'src/upgrade-package/constants/upgrade.constant';
import { Constants } from 'src/infrastructure/utils/constants';
import { UpgradeOrderService } from './upgrade-order.service';
import { UpgradeOrderDto } from '../dtos/upgrade-order.dto';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found-exception';
import { CannotDowngradeOrderException } from '../exceptions/cannot-downgrade-order.exception';
import { TotalMonthLesserThanMinMonthException } from '../exceptions/total-month-lesser-min-order-month.exception';
import { CannotTransferToTheSameUpgradePackage } from '../exceptions/cannot-transfer-to-the-same-upgrade-package.exception';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { NotValidExpireDateException } from '../exceptions/not-valid-expired-date.exception';

describe('UpgradeOrderService', () => {
  let service: UpgradeOrderService;

  const upgradePackageOrderRepository = {
    findCurrentUpgradePackageByUserId: jest.fn(),
    findManyPendingOrderByUserId: jest.fn(),
    cancelOrderAndTransaction: jest.fn(),
    createUpgradeOrderByBanking: jest.fn(),
    deactivateCurentUpgradePackageByUserId: jest.fn(),
    createSuccessUpgradeOrderByWallet: jest.fn(),
  };
  const upgradePackageRepository = { findFirst: jest.fn() };
  const sepayService = {
    validateWalletBalanceIsEnough: jest.fn(),
    generatePayment: jest.fn(),
  };
  const userRepository = { updateMaxQuotaByUserIdTransaction: jest.fn() };
  const keycloakService = {
    deleteRolesFromUser: jest.fn(),
    addRoleToUser: jest.fn(),
  };
  const notificationService = { addNotificationToQueue: jest.fn() };
  const upgradeQueue = { add: jest.fn() };
  const tx = { tx: true };
  const prisma = { $transaction: jest.fn() };

  const makePackage = (overrides: Record<string, unknown> = {}) => ({
    id: 'pkg-new',
    name: 'Gold',
    summary: 'summary',
    price: new Prisma.Decimal(100000),
    minOrderMonth: 1,
    maxPhotoQuota: BigInt(2000),
    maxPackageCount: BigInt(20),
    descriptions: [],
    status: 'ENABLED',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  });

  const makeActiveOrder = (overrides: Record<string, unknown> = {}) => ({
    id: 'order-1',
    userId: 'user-1',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    expiredAt: new Date('2024-02-01T00:00:00Z'),
    upgradePackageHistory: {
      id: 'history-1',
      maxPhotoQuota: BigInt(1000),
      maxPackageCount: BigInt(10),
      originalUpgradePackageId: 'pkg-old',
    },
    serviceTransaction: {
      id: 'st-1',
      transaction: {
        id: 'tr-1',
        amount: new Prisma.Decimal(300000),
      },
    },
    ...overrides,
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (cb: (client: unknown) => Promise<unknown>) => cb(tx),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpgradeOrderService,
        {
          provide: UpgradePackageOrderRepository,
          useValue: upgradePackageOrderRepository,
        },
        {
          provide: UpgradePackageRepository,
          useValue: upgradePackageRepository,
        },
        { provide: SepayService, useValue: sepayService },
        { provide: UserRepository, useValue: userRepository },
        { provide: IdentityService, useValue: keycloakService },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: getQueueToken(UpgradeConstant.UPGRADE_QUEUE),
          useValue: upgradeQueue,
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UpgradeOrderService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findActiveUpgradePackageOrderByUserId', () => {
    it('should return null when user has no active order', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );

      await expect(
        service.findActiveUpgradePackageOrderByUserId('user-1'),
      ).resolves.toBeNull();
    });

    it('should return UpgradeOrderDto when user has an active order', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );

      const result =
        await service.findActiveUpgradePackageOrderByUserId('user-1');

      expect(result).toBeInstanceOf(UpgradeOrderDto);
      expect(result?.id).toBe('order-1');
    });
  });

  describe('calculateTransferFee', () => {
    it('should throw UpgradePackageNotFoundException when package does not exist', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageRepository.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateTransferFee('user-1', 'pkg-new', { totalMonths: 1 }),
      ).rejects.toThrow(UpgradePackageNotFoundException);
      expect(upgradePackageRepository.findFirst).toHaveBeenCalledWith({
        id: 'pkg-new',
        status: 'ENABLED',
      });
    });

    it('should throw CannotDowngradeOrderException when new package has lower quota', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ maxPhotoQuota: BigInt(500) }),
      );

      await expect(
        service.calculateTransferFee('user-1', 'pkg-new', { totalMonths: 1 }),
      ).rejects.toThrow(CannotDowngradeOrderException);
    });

    it('should throw TotalMonthLesserThanMinMonthException when total months is lower than min order month', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ minOrderMonth: 3 }),
      );

      await expect(
        service.calculateTransferFee('user-1', 'pkg-new', { totalMonths: 1 }),
      ).rejects.toThrow(TotalMonthLesserThanMinMonthException);
    });

    it('should throw CannotTransferToTheSameUpgradePackage when transferring to the active package', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ id: 'pkg-old' }),
      );

      await expect(
        service.calculateTransferFee('user-1', 'pkg-old', { totalMonths: 1 }),
      ).rejects.toThrow(CannotTransferToTheSameUpgradePackage);
    });

    it('should return full price of the requested total months (not min order month) when user has no active order', async () => {
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ minOrderMonth: 2 }),
      );

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 3,
      });

      expect(result).toEqual(
        expect.objectContaining({
          remainPrice: 300000,
          timeSpanPassed: 0,
          discountPrice: 0,
          refundPrice: 0,
          maxiumDiscoutPrice: 0,
          currentActivePackage: null,
        }),
      );
      expect(result.upgradePackage.price).toBe(100000);
    });

    it('should discount the whole previous amount when upgrading instantly', async () => {
      jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ price: new Prisma.Decimal(500000) }),
      );

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 1,
      });

      expect(result).toEqual(
        expect.objectContaining({
          remainPrice: 200000,
          refundPrice: 0,
          timeSpanPassed: 0,
          discountPrice: 300000,
          maxiumDiscoutPrice: 300000,
        }),
      );
      expect(result.currentActivePackage).toBeInstanceOf(UpgradeOrderDto);
    });

    it('should refund the difference when upgrading instantly to a cheaper total', async () => {
      jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 1,
      });

      expect(result.remainPrice).toBe(0);
      expect(result.refundPrice).toBe(200000);
    });

    it('should charge the full price without discount when time passed exceeds the discount time span', async () => {
      jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder({
          createdAt: new Date('2023-12-01T00:00:00Z'),
          expiredAt: new Date(1000),
        }),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 3,
      });

      expect(result).toEqual(
        expect.objectContaining({
          refundPrice: 0,
          remainPrice: 300000,
          timeSpanPassed: 31 * 24 * 60 * 60 * 1000,
          discountPrice: 0,
          maxiumDiscoutPrice: 300000,
        }),
      );
      expect(result.currentActivePackage).toBeInstanceOf(UpgradeOrderDto);
    });

    it('should apply a time based discount relative to the plan duration and charge the remain price', async () => {
      //plan: 2024-01-01 -> 2024-02-01 (31 days), 15 days passed
      jest.useFakeTimers({ now: new Date('2024-01-16T00:00:00Z') });
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder(),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 3,
      });

      //credit = 300000 * (1 - 15/31) = 154838.70..., remain = 300000 - credit = 145161.29...
      expect(result).toEqual(
        expect.objectContaining({
          remainPrice: 145161,
          refundPrice: 0,
          timeSpanPassed: 15 * 24 * 60 * 60 * 1000,
          discountPrice: 154838,
          maxiumDiscoutPrice: 300000,
        }),
      );
    });

    describe('worked example: paid 38000 for a 6-month plan, 3 months passed, target 50000/month for 12 months', () => {
      const sixMonthOrder = () =>
        makeActiveOrder({
          createdAt: new Date('2024-01-01T00:00:00Z'),
          expiredAt: new Date('2024-07-01T00:00:00Z'),
          serviceTransaction: {
            id: 'st-1',
            transaction: { id: 'tr-1', amount: new Prisma.Decimal(38000) },
          },
        });

      beforeEach(() => {
        upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
          sixMonthOrder(),
        );
        upgradePackageRepository.findFirst.mockResolvedValue(
          makePackage({ price: new Prisma.Decimal(50000), minOrderMonth: 1 }),
        );
      });

      it('should credit the unused half of the paid amount (discount 19000, remain 581000)', async () => {
        //2024-01-01 -> 2024-04-01 = 91 days of a 182 days plan => exactly half passed
        jest.useFakeTimers({ now: new Date('2024-04-01T00:00:00Z') });

        const result = await service.calculateTransferFee('user-1', 'pkg-new', {
          totalMonths: 12,
        });

        expect(result).toEqual(
          expect.objectContaining({
            remainPrice: 581000,
            refundPrice: 0,
            timeSpanPassed: 91 * 24 * 60 * 60 * 1000,
            discountPrice: 19000,
            maxiumDiscoutPrice: 38000,
          }),
        );
      });

      it('should give no discount once the whole plan duration has passed', async () => {
        jest.useFakeTimers({ now: new Date('2024-07-01T00:00:00Z') });

        const result = await service.calculateTransferFee('user-1', 'pkg-new', {
          totalMonths: 12,
        });

        expect(result).toEqual(
          expect.objectContaining({
            remainPrice: 600000,
            refundPrice: 0,
            discountPrice: 0,
            maxiumDiscoutPrice: 38000,
          }),
        );
      });

      it('should price the new package for the requested total months when upgrading instantly', async () => {
        jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });

        const result = await service.calculateTransferFee('user-1', 'pkg-new', {
          totalMonths: 12,
        });

        //50000 * 12 - 38000
        expect(result).toEqual(
          expect.objectContaining({
            remainPrice: 562000,
            refundPrice: 0,
            timeSpanPassed: 0,
            discountPrice: 38000,
            maxiumDiscoutPrice: 38000,
          }),
        );
      });
    });

    it('should return refund price when discount exceeds the new package price', async () => {
      jest.useFakeTimers({ now: new Date('2024-01-16T00:00:00Z') });
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        makeActiveOrder({
          serviceTransaction: {
            id: 'st-1',
            transaction: { id: 'tr-1', amount: new Prisma.Decimal(1000000) },
          },
        }),
      );
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());

      const result = await service.calculateTransferFee('user-1', 'pkg-new', {
        totalMonths: 1,
      });

      expect(result.remainPrice).toBe(0);
      expect(result.refundPrice).toBeGreaterThan(0);
    });
  });

  describe('requestUpgradePayment', () => {
    const makeRequest = (
      paymentMethod: PaymentMethod,
      totalMonths = 1,
    ): RequestUpgradeDto =>
      Object.assign(new RequestUpgradeDto(), {
        upgradePackageId: 'pkg-new',
        totalMonths,
        paymentMethod,
      });

    const createdOrder = {
      id: 'new-order',
      serviceTransaction: {
        id: 'st-2',
        transaction: {
          id: 'tr-2',
          amount: new Prisma.Decimal(100000),
        },
      },
    };

    it('should throw UpgradePackageNotFoundException when package does not exist', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(null);

      await expect(
        service.requestUpgradePayment('user-1', makeRequest('SEPAY')),
      ).rejects.toThrow(UpgradePackageNotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw TotalMonthLesserThanMinMonthException when total months is lower than package min order month', async () => {
      upgradePackageRepository.findFirst
        .mockResolvedValueOnce(makePackage({ minOrderMonth: 6 }))
        .mockResolvedValueOnce(makePackage({ minOrderMonth: 1 }));
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [],
      );

      await expect(
        service.requestUpgradePayment('user-1', makeRequest('SEPAY', 3)),
      ).rejects.toThrow(TotalMonthLesserThanMinMonthException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should cancel pending orders, create banking order and generate payment url when paying with SEPAY', async () => {
      const upgradePackage = makePackage();
      upgradePackageRepository.findFirst.mockResolvedValue(upgradePackage);
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [{ id: 'pending-1' }, { id: 'pending-2' }],
      );
      upgradePackageOrderRepository.cancelOrderAndTransaction.mockResolvedValue(
        undefined,
      );
      upgradePackageOrderRepository.createUpgradeOrderByBanking.mockResolvedValue(
        createdOrder,
      );
      sepayService.generatePayment.mockResolvedValue({
        paymentUrl: 'https://pay',
        mockQrCode: 'qr',
      });

      const result = await service.requestUpgradePayment(
        'user-1',
        makeRequest('SEPAY'),
      );

      expect(sepayService.validateWalletBalanceIsEnough).not.toHaveBeenCalled();
      expect(
        upgradePackageOrderRepository.cancelOrderAndTransaction,
      ).toHaveBeenCalledWith('pending-1', tx);
      expect(
        upgradePackageOrderRepository.cancelOrderAndTransaction,
      ).toHaveBeenCalledWith('pending-2', tx);

      const createArgs =
        upgradePackageOrderRepository.createUpgradeOrderByBanking.mock.calls[0];
      expect(createArgs[0]).toBe('user-1');
      expect(createArgs[1]).toBe(upgradePackage);
      const expiredDate: Date = createArgs[2];
      expect(expiredDate.getTime() - Date.now()).toBeGreaterThan(
        29 * 24 * 60 * 60 * 1000,
      );
      expect((createArgs[3] as Prisma.Decimal).toNumber()).toBe(100000);
      expect((createArgs[4] as Prisma.Decimal).toNumber()).toBe(0);
      expect(createArgs[5]).toBe(tx);

      expect(sepayService.generatePayment).toHaveBeenCalledWith('tr-2', 100000);
      expect(result).toBeInstanceOf(RequestUpgradeOrderResponseDto);
      expect(result.paymentUrl).toBe('https://pay');
      expect(result.mockQrCode).toBe('qr');
      expect(keycloakService.addRoleToUser).not.toHaveBeenCalled();
    });

    it('should create success order, upgrade role and notify when paying with WALLET', async () => {
      const upgradePackage = makePackage();
      upgradePackageRepository.findFirst.mockResolvedValue(upgradePackage);
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [],
      );
      sepayService.validateWalletBalanceIsEnough.mockResolvedValue(undefined);
      upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet.mockResolvedValue(
        createdOrder,
      );

      const result = await service.requestUpgradePayment(
        'user-1',
        makeRequest('WALLET'),
      );

      expect(sepayService.validateWalletBalanceIsEnough).toHaveBeenCalledWith(
        'user-1',
        100000,
      );
      expect(
        upgradePackageOrderRepository.deactivateCurentUpgradePackageByUserId,
      ).toHaveBeenCalledWith('user-1', tx);
      expect(
        upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet,
      ).toHaveBeenCalledWith(
        'user-1',
        upgradePackage,
        expect.any(Date),
        expect.any(Prisma.Decimal),
        expect.any(Prisma.Decimal),
        expect.objectContaining({ remainPrice: 100000 }),
        tx,
      );
      expect(
        userRepository.updateMaxQuotaByUserIdTransaction,
      ).toHaveBeenCalledWith(
        'user-1',
        upgradePackage.maxPhotoQuota,
        upgradePackage.maxPackageCount,
        tx,
      );
      expect(keycloakService.deleteRolesFromUser).toHaveBeenCalledWith(
        'user-1',
      );
      expect(keycloakService.addRoleToUser).toHaveBeenCalledWith(
        'user-1',
        Constants.PHOTOGRAPHER_ROLE,
      );
      expect(upgradeQueue.add).toHaveBeenCalledWith(
        UpgradeConstant.RESTORE_PHOTO_VISIBILITY,
        { photographerId: 'user-1' },
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          referenceType: 'UPGRADE_PACKAGE',
          payload: { id: 'pkg-new' },
        }),
      );
      expect(sepayService.generatePayment).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(RequestUpgradeOrderResponseDto);
      expect(result.id).toBe('new-order');
    });

    it('should enqueue RESTORE_PHOTO_VISIBILITY with the photographerId key read by the consumer when paying with WALLET', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [],
      );
      upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet.mockResolvedValue(
        createdOrder,
      );

      await service.requestUpgradePayment('user-1', makeRequest('WALLET'));

      expect(upgradeQueue.add).toHaveBeenCalledTimes(1);
      const [jobName, jobData] = upgradeQueue.add.mock.calls[0];
      expect(jobName).toBe(UpgradeConstant.RESTORE_PHOTO_VISIBILITY);
      expect(jobData).toEqual({ photographerId: 'user-1' });
    });

    describe('expired date', () => {
      const arrangeNoActiveOrder = () => {
        upgradePackageRepository.findFirst.mockResolvedValue(makePackage());
        upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
          null,
        );
        upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
          [],
        );
        upgradePackageOrderRepository.createUpgradeOrderByBanking.mockResolvedValue(
          createdOrder,
        );
        upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet.mockResolvedValue(
          createdOrder,
        );
        sepayService.generatePayment.mockResolvedValue({
          paymentUrl: 'https://pay',
          mockQrCode: 'qr',
        });
      };

      it('should expire a SEPAY order after the requested total months (12 months, not 30 days)', async () => {
        jest.useFakeTimers({ now: new Date('2024-04-01T00:00:00Z') });
        arrangeNoActiveOrder();

        await service.requestUpgradePayment('user-1', makeRequest('SEPAY', 12));

        const expiredDate: Date =
          upgradePackageOrderRepository.createUpgradeOrderByBanking.mock
            .calls[0][2];
        expect(expiredDate.toISOString()).toBe('2025-04-01T00:00:00.000Z');
      });

      it('should expire a WALLET order after the requested total months (6 months)', async () => {
        jest.useFakeTimers({ now: new Date('2024-01-15T10:30:00Z') });
        arrangeNoActiveOrder();

        await service.requestUpgradePayment('user-1', makeRequest('WALLET', 6));

        const expiredDate: Date =
          upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet.mock
            .calls[0][2];
        expect(expiredDate.toISOString()).toBe('2024-07-15T10:30:00.000Z');
      });

      it('should clamp to the last day of the target month in a leap year (Jan 31 + 1 month = Feb 29)', async () => {
        jest.useFakeTimers({ now: new Date('2024-01-31T00:00:00Z') });
        arrangeNoActiveOrder();

        await service.requestUpgradePayment('user-1', makeRequest('SEPAY', 1));

        const expiredDate: Date =
          upgradePackageOrderRepository.createUpgradeOrderByBanking.mock
            .calls[0][2];
        expect(expiredDate.toISOString()).toBe('2024-02-29T00:00:00.000Z');
      });

      it('should clamp to the last day of the target month in a non leap year (Jan 31 + 13 months = Feb 28)', async () => {
        jest.useFakeTimers({ now: new Date('2024-01-31T00:00:00Z') });
        arrangeNoActiveOrder();

        await service.requestUpgradePayment('user-1', makeRequest('SEPAY', 13));

        const expiredDate: Date =
          upgradePackageOrderRepository.createUpgradeOrderByBanking.mock
            .calls[0][2];
        expect(expiredDate.toISOString()).toBe('2025-02-28T00:00:00.000Z');
      });

      it('should throw NotValidExpireDateException when the expired date is before now', async () => {
        jest.useFakeTimers({ now: new Date('2024-04-01T00:00:00Z') });
        arrangeNoActiveOrder();
        upgradePackageRepository.findFirst.mockResolvedValue(
          makePackage({ minOrderMonth: -1 }),
        );

        await expect(
          service.requestUpgradePayment('user-1', makeRequest('SEPAY', -1)),
        ).rejects.toThrow(NotValidExpireDateException);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });
    });

    it('should propagate NotEnoughBalanceException when wallet balance is not enough', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [],
      );
      sepayService.validateWalletBalanceIsEnough.mockRejectedValue(
        new NotEnoughBalanceException(),
      );

      await expect(
        service.requestUpgradePayment('user-1', makeRequest('WALLET')),
      ).rejects.toThrow(NotEnoughBalanceException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should only cancel pending orders when payment method is neither SEPAY nor WALLET', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());
      upgradePackageOrderRepository.findCurrentUpgradePackageByUserId.mockResolvedValue(
        null,
      );
      upgradePackageOrderRepository.findManyPendingOrderByUserId.mockResolvedValue(
        [{ id: 'pending-1' }],
      );

      const result = await service.requestUpgradePayment(
        'user-1',
        makeRequest('OTHER' as PaymentMethod),
      );

      expect(result).toBeUndefined();
      expect(
        upgradePackageOrderRepository.cancelOrderAndTransaction,
      ).toHaveBeenCalledWith('pending-1', tx);
      expect(
        upgradePackageOrderRepository.createUpgradeOrderByBanking,
      ).not.toHaveBeenCalled();
      expect(
        upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet,
      ).not.toHaveBeenCalled();
    });
  });
});
