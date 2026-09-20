import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { IdentityService } from 'src/authen/services/identity.service';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotoService } from 'src/photo/services/photo.service';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';
import { SepayService } from 'src/payment/services/sepay.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { PhotographerNotFoundException } from 'src/photographer/exceptions/photographer-not-found.exception';
import { UserDto } from 'src/user/dtos/user.dto';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';
import { BalanceDto } from '../dtos/balance.dto';
import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { TopSoldPhotoDto } from '../dtos/top-sold-photo.dto';
import { GenerateDashboardReportService } from './generate-dashboard-report.cron.service';

describe('GenerateDashboardReportService', () => {
  let service: GenerateDashboardReportService;

  const keycloakService = { findUsersHasRole: jest.fn() };
  const upgradeOrderRepository = { count: jest.fn() };
  const upgradePackageRepository = { findAll: jest.fn() };
  const photoRepository = {
    findPhotoIdsByPhotographerIdOrderByPhotoSellingCount: jest.fn(),
    findUniqueOrThrowIgnoreSoftDelete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
  const userToUserTransactionRepository = { findMany: jest.fn() };
  const transactionRepository = { findAll: jest.fn(), aggregate: jest.fn() };
  const photoshootPackageRepository = {
    findAllIgnoreSoftDelete: jest.fn(),
    count: jest.fn(),
  };
  const photoSellRepository = { findMany: jest.fn() };
  const cameraRepository = { count: jest.fn() };
  const photoBuyRepository = { count: jest.fn() };
  const userRepository = { findUniqueOrThrow: jest.fn() };
  const photoService = { signPhoto: jest.fn() };
  const bookingBillItemRepository = { aggregate: jest.fn() };
  const sepayService = { calculateWalletFromTransactions: jest.fn() };

  const fromDate = new Date('2024-01-01T00:00:00.000Z');
  const toDate = new Date('2024-01-31T00:00:00.000Z');
  const dashboardRequestDto = Object.assign(new DashboardRequestDto(), {
    fromDate,
    toDate,
  });

  const makeUser = (id: string) => ({
    id,
    name: `name-${id}`,
    mail: `${id}@gmail.com`,
    normalizedName: id,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerateDashboardReportService,
        { provide: IdentityService, useValue: keycloakService },
        {
          provide: UpgradePackageOrderRepository,
          useValue: upgradeOrderRepository,
        },
        {
          provide: UpgradePackageRepository,
          useValue: upgradePackageRepository,
        },
        { provide: PhotoRepository, useValue: photoRepository },
        {
          provide: UserToUserRepository,
          useValue: userToUserTransactionRepository,
        },
        { provide: TransactionRepository, useValue: transactionRepository },
        {
          provide: PhotoshootRepository,
          useValue: photoshootPackageRepository,
        },
        { provide: PhotoSellRepository, useValue: photoSellRepository },
        { provide: CameraRepository, useValue: cameraRepository },
        { provide: PhotoBuyRepository, useValue: photoBuyRepository },
        { provide: UserRepository, useValue: userRepository },
        { provide: PhotoService, useValue: photoService },
        {
          provide: BookingBillItemRepository,
          useValue: bookingBillItemRepository,
        },
        { provide: SepayService, useValue: sepayService },
      ],
    }).compile();

    service = moduleRef.get(GenerateDashboardReportService);
  });

  describe('getTopSellerDetail', () => {
    const arrangeCommon = () => {
      userRepository.findUniqueOrThrow.mockResolvedValue(makeUser('user-1'));
      photoRepository.findPhotoIdsByPhotographerIdOrderByPhotoSellingCount.mockResolvedValue(
        [
          { id: 'photo-1', count: 5 },
          { id: 'photo-2', count: 2 },
        ],
      );
      photoRepository.findUniqueOrThrowIgnoreSoftDelete.mockImplementation(
        async (id: string) => ({ id }),
      );
      photoService.signPhoto.mockImplementation(
        async (photo: { id: string }) => ({
          ...photo,
          signed: true,
        }),
      );
      photoshootPackageRepository.findAllIgnoreSoftDelete.mockResolvedValue([
        { id: 'pp-1', title: 'less', _count: { bookings: 1 } },
        { id: 'pp-2', title: 'more', _count: { bookings: 3 } },
        { id: 'pp-3', title: 'middle', _count: { bookings: 2 } },
      ]);
      transactionRepository.findAll.mockResolvedValue([
        {
          amount: new Prisma.Decimal(900),
          fee: new Prisma.Decimal(100),
        },
        {
          amount: new Prisma.Decimal(1800),
          fee: new Prisma.Decimal(200),
        },
      ]);
    };

    it('should build detail report with booking revenue from increase and decrease bill items', async () => {
      arrangeCommon();
      bookingBillItemRepository.aggregate
        .mockResolvedValueOnce({ _sum: { price: new Prisma.Decimal(5000) } })
        .mockResolvedValueOnce({ _sum: { price: new Prisma.Decimal(1500) } });

      const result = await service.getTopSellerDetail(
        'user-1',
        dashboardRequestDto,
      );

      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('user-1');
      expect(
        photoRepository.findPhotoIdsByPhotographerIdOrderByPhotoSellingCount,
      ).toHaveBeenCalledWith('user-1', fromDate, toDate);
      expect(result.topSoldPhotos).toHaveLength(2);
      expect(result.topSoldPhotos[0]).toBeInstanceOf(TopSoldPhotoDto);
      expect(result.topSoldPhotos[0].soldCount).toBe(5);
      expect(result.topSoldPhotos[0].detail).toEqual({
        id: 'photo-1',
        signed: true,
      });
      expect(result.topPhotoshootPackages.map((p) => p.id)).toEqual([
        'pp-2',
        'pp-3',
        'pp-1',
      ]);
      expect(result.topPhotoshootPackages[0]).toBeInstanceOf(
        PhotoshootPackageDto,
      );
      expect(transactionRepository.findAll).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'IMAGE_SELL',
        status: 'SUCCESS',
        createdAt: { lte: toDate, gte: fromDate },
      });
      expect(result.photoSellRevenue).toBe(3000);
      expect(result.photoshootPackageRevenue).toBe(3500);
      expect(bookingBillItemRepository.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({ type: 'INCREASE' }),
        }),
      );
      expect(bookingBillItemRepository.aggregate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({ type: 'DECREASE' }),
        }),
      );
      expect(result.user).toBeInstanceOf(UserDto);
      expect(result.user.id).toBe('user-1');
    });

    it('should return zero booking revenue when there is no bill item', async () => {
      arrangeCommon();
      bookingBillItemRepository.aggregate.mockResolvedValue({
        _sum: { price: null },
      });

      const result = await service.getTopSellerDetail(
        'user-1',
        dashboardRequestDto,
      );

      expect(result.photoshootPackageRevenue).toBe(0);
    });
  });

  describe('getTopSellers', () => {
    it('should throw PhotographerNotFoundException when keycloak user has no id', async () => {
      keycloakService.findUsersHasRole.mockResolvedValue([
        { username: 'no-id' },
      ]);

      await expect(service.getTopSellers(dashboardRequestDto)).rejects.toThrow(
        PhotographerNotFoundException,
      );
      expect(photoBuyRepository.count).not.toHaveBeenCalled();
    });

    it('should return photographers sorted by sale count without zero sellers', async () => {
      keycloakService.findUsersHasRole.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ]);
      photoBuyRepository.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0);
      userRepository.findUniqueOrThrow.mockImplementation(async (id: string) =>
        makeUser(id),
      );

      const result = await service.getTopSellers(dashboardRequestDto);

      expect(keycloakService.findUsersHasRole).toHaveBeenCalledWith(
        Constants.PHOTOGRAPHER_ROLE,
        0,
        -1,
      );
      expect(photoBuyRepository.count).toHaveBeenCalledWith({
        createdAt: { lte: toDate, gte: fromDate },
        photoSellHistory: {
          originalPhotoSell: { photo: { photographerId: 'a' } },
        },
        userToUserTransaction: {
          fromUserTransaction: { status: 'SUCCESS' },
        },
      });
      expect(result.map((r) => [r.id, r.totalPhotoSale])).toEqual([
        ['b', 5],
        ['a', 2],
      ]);
      expect(result[0].detail).toBeInstanceOf(UserDto);
      expect(result[0].detail.id).toBe('b');
      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateTotalBalance', () => {
    it('should return total balance and total withdrawal', async () => {
      const transactions = [{ id: 't1' }];
      transactionRepository.findAll.mockResolvedValue(transactions);
      sepayService.calculateWalletFromTransactions.mockResolvedValue(
        new Prisma.Decimal(12345),
      );
      transactionRepository.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      });

      const result = await service.calculateTotalBalance();

      expect(transactionRepository.findAll).toHaveBeenCalledWith({
        status: 'SUCCESS',
      });
      expect(sepayService.calculateWalletFromTransactions).toHaveBeenCalledWith(
        transactions,
      );
      expect(result).toBeInstanceOf(BalanceDto);
      expect(result.totalBalance).toBe(12345);
      expect(result.totalWithdrawal).toBe(500);
    });

    it('should return zero withdrawal when there is no withdrawal', async () => {
      transactionRepository.findAll.mockResolvedValue([]);
      sepayService.calculateWalletFromTransactions.mockResolvedValue(
        new Prisma.Decimal(0),
      );
      transactionRepository.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.calculateTotalBalance();

      expect(result.totalWithdrawal).toBe(0);
    });
  });

  describe('generateDashboardData', () => {
    const inRange = new Date('2024-01-15T00:00:00.000Z').getTime();
    const beforeRange = new Date('2023-12-15T00:00:00.000Z').getTime();
    const afterRange = new Date('2024-02-15T00:00:00.000Z').getTime();

    const arrange = (withSums: boolean) => {
      keycloakService.findUsersHasRole
        .mockResolvedValueOnce([
          { id: 'c1', createdTimestamp: inRange },
          { id: 'c2', createdTimestamp: beforeRange },
          { id: 'c3', createdTimestamp: afterRange },
          { id: 'c4' },
          { id: 'c5', createdTimestamp: fromDate.getTime() },
        ])
        .mockResolvedValueOnce([
          { id: 'p1', createdTimestamp: toDate.getTime() },
          { id: 'p2' },
        ]);
      userToUserTransactionRepository.findMany.mockResolvedValue([
        { toUserTransaction: { fee: new Prisma.Decimal(10) } },
        { toUserTransaction: { fee: new Prisma.Decimal(15) } },
      ]);
      const successTransactions = [{ id: 'success' }];
      transactionRepository.findAll
        .mockResolvedValueOnce([
          { amount: new Prisma.Decimal(100), fee: new Prisma.Decimal(20) },
          { amount: new Prisma.Decimal(200), fee: new Prisma.Decimal(0) },
        ])
        .mockResolvedValueOnce(successTransactions);
      photoshootPackageRepository.count.mockResolvedValue(7);
      upgradePackageRepository.findAll.mockResolvedValue([
        { id: 'pkg-1', name: 'Gold', price: new Prisma.Decimal(100000) },
        { id: 'pkg-2', name: 'Silver', price: new Prisma.Decimal(50000) },
      ]);
      upgradeOrderRepository.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1);
      photoSellRepository.findMany.mockResolvedValue([
        { id: 'photo-1', _count: { photoSellHistories: 9 } },
      ]);
      cameraRepository.count.mockResolvedValue(3);
      photoRepository.count
        .mockResolvedValueOnce(11)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(13)
        .mockResolvedValueOnce(40);
      photoRepository.aggregate
        .mockResolvedValueOnce({ _sum: { size: withSums ? 300 : null } })
        .mockResolvedValueOnce({ _sum: { size: withSums ? 700 : null } });
      transactionRepository.aggregate.mockResolvedValue({
        _sum: { amount: withSums ? new Prisma.Decimal(250) : null },
      });
      sepayService.calculateWalletFromTransactions.mockResolvedValue(
        new Prisma.Decimal(9999),
      );
      return successTransactions;
    };

    it('should aggregate all dashboard metrics', async () => {
      const successTransactions = arrange(true);

      const result = await service.generateDashboardData(dashboardRequestDto);

      expect(keycloakService.findUsersHasRole).toHaveBeenNthCalledWith(
        1,
        Constants.CUSTOMER_ROLE,
        0,
        -1,
      );
      expect(keycloakService.findUsersHasRole).toHaveBeenNthCalledWith(
        2,
        Constants.PHOTOGRAPHER_ROLE,
        0,
        -1,
      );
      expect(result.totalCustomer).toBe(2);
      expect(result.totalPhotographer).toBe(1);
      expect(result.revenueFromSellingPhoto).toBe(25);
      expect(result.revenueFromUpgradePackage).toBe(320);
      expect(result.totalRevenue).toBe(345);
      expect(result.totalPhotoshootPackage).toBe(7);
      expect(result.topUsedUpgradePackage).toHaveLength(2);
      expect(result.topUsedUpgradePackage[0].totalUsed).toBe(4);
      expect(result.topUsedUpgradePackage[0].upgradePackageDto).toBeInstanceOf(
        UpgradePackageDto,
      );
      expect(result.topUsedUpgradePackage[0].upgradePackageDto.price).toBe(
        100000,
      );
      expect(result.topUsedUpgradePackage[1].totalUsed).toBe(1);
      expect(upgradeOrderRepository.count).toHaveBeenCalledWith({
        upgradePackageHistory: { originalUpgradePackageId: 'pkg-1' },
        serviceTransaction: { transaction: { status: 'SUCCESS' } },
        createdAt: { lte: toDate, gte: fromDate },
      });
      expect(result.topSellingPhoto).toHaveLength(1);
      expect(result.topSellingPhoto[0].totalPhotoSold).toBe(9);
      expect(result.topSellingPhoto[0].photo).toBeInstanceOf(SignedPhotoDto);
      expect(result.totalCamera).toBe(3);
      expect(result.totalSellingPhoto).toBe(11);
      expect(result.totalRawPhoto).toBe(12);
      expect(result.totalBookingPhoto).toBe(13);
      expect(result.totalPhoto).toBe(40);
      expect(result.totalBookingSize).toBe(300);
      expect(result.totalPhotoSize).toBe(700);
      expect(result.totalSize).toBe(1000);
      expect(result.totalWithdrawal).toBe(250);
      expect(result.totalBalance).toBe(9999);
      expect(sepayService.calculateWalletFromTransactions).toHaveBeenCalledWith(
        successTransactions,
      );
      expect(transactionRepository.findAll).toHaveBeenNthCalledWith(1, {
        status: 'SUCCESS',
        type: 'UPGRADE_TO_PHOTOGRAPHER',
        serviceTransaction: { isNot: null },
        createdAt: { lte: toDate, gte: fromDate },
      });
      expect(transactionRepository.findAll).toHaveBeenNthCalledWith(2, {
        status: 'SUCCESS',
        createdAt: { gte: fromDate, lte: toDate },
      });
    });

    it('should default sizes and withdrawal to zero when aggregates are empty', async () => {
      arrange(false);

      const result = await service.generateDashboardData(dashboardRequestDto);

      expect(result.totalBookingSize).toBe(0);
      expect(result.totalPhotoSize).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.totalWithdrawal).toBe(0);
    });
  });
});
