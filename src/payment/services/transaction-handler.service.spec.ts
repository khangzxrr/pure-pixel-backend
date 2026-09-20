import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Prisma, Transaction } from '@prisma/client';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ServiceTransactionRepository } from 'src/database/repositories/service-transaction.repository';
import { DatabaseService } from 'src/database/database.service';
import { IdentityService } from 'src/authen/services/identity.service';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { UpgradeConstant } from 'src/upgrade-package/constants/upgrade.constant';
import { Constants } from 'src/infrastructure/utils/constants';
import { PhotoBuyNotFoundException } from 'src/photo/exceptions/photo-buy-not-found.exception';
import { CurrentUpgradePackageOrderNotFound } from 'src/upgrade-order/exceptions/current-upgrade-package-order-not-found.exception';
import { TransactionHandlerService } from './transaction-handler.service';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { SepayRequestDto } from '../dtos/sepay.request.dto';

describe('TransactionHandlerService', () => {
  let service: TransactionHandlerService;

  const userRepository = {
    update: jest.fn(),
    updateMaxQuotaByUserId: jest.fn(),
  };
  const serviceTransactionRepository = {
    findById: jest.fn(),
    updateSuccessServiceTransactionAndActivateUpgradeOrder: jest.fn(),
  };
  const databaseService = { applyTransactionMultipleQueries: jest.fn() };
  const keycloakService = {
    deleteRolesFromUser: jest.fn(),
    addRoleToUser: jest.fn(),
  };
  const transactionRepository = { updateStatusAndPayload: jest.fn() };
  const userToUserRepository = {
    getById: jest.fn(),
    markSucccessAndCreateToUserTransaction: jest.fn(),
  };
  const notificationService = { addNotificationToQueue: jest.fn() };
  const upgradeQueue = { add: jest.fn() };

  const sepay = Object.assign(new SepayRequestDto(), {
    content: 'PXLtrPXL',
    transferAmount: 1000,
  });

  const transaction = {
    id: 'tr-1',
    userId: 'buyer-1',
    type: 'IMAGE_BUY',
    status: 'PENDING',
    amount: new Prisma.Decimal(1000),
    fee: new Prisma.Decimal(100),
  } as unknown as Transaction;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionHandlerService,
        { provide: UserRepository, useValue: userRepository },
        {
          provide: ServiceTransactionRepository,
          useValue: serviceTransactionRepository,
        },
        { provide: DatabaseService, useValue: databaseService },
        { provide: IdentityService, useValue: keycloakService },
        { provide: TransactionRepository, useValue: transactionRepository },
        { provide: UserToUserRepository, useValue: userToUserRepository },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: getQueueToken(UpgradeConstant.UPGRADE_QUEUE),
          useValue: upgradeQueue,
        },
      ],
    }).compile();

    service = moduleRef.get(TransactionHandlerService);
  });

  describe('handleUpgradeToPhotographer', () => {
    it('should throw CurrentUpgradePackageOrderNotFound when service transaction has no upgrade order', async () => {
      serviceTransactionRepository.findById.mockResolvedValue({
        id: 'st-1',
        upgradeOrder: null,
      });

      await expect(
        service.handleUpgradeToPhotographer('user-1', 'st-1', sepay),
      ).rejects.toThrow(CurrentUpgradePackageOrderNotFound);
      expect(
        databaseService.applyTransactionMultipleQueries,
      ).not.toHaveBeenCalled();
      expect(keycloakService.addRoleToUser).not.toHaveBeenCalled();
    });

    it('should activate upgrade order, update quota, roles and notify user', async () => {
      serviceTransactionRepository.findById.mockResolvedValue({
        id: 'st-1',
        upgradeOrder: {
          upgradePackageHistory: {
            maxPhotoQuota: BigInt(1000),
            maxPackageCount: BigInt(10),
          },
        },
      });
      serviceTransactionRepository.updateSuccessServiceTransactionAndActivateUpgradeOrder.mockReturnValue(
        'updateQuery',
      );
      userRepository.update.mockReturnValue('deactivateQuery');
      userRepository.updateMaxQuotaByUserId.mockReturnValue('quotaQuery');
      databaseService.applyTransactionMultipleQueries.mockResolvedValue([
        'deactivated',
        { id: 'updated-transaction' },
        'quota',
      ]);

      await service.handleUpgradeToPhotographer('user-1', 'st-1', sepay);

      expect(serviceTransactionRepository.findById).toHaveBeenCalledWith(
        'st-1',
        true,
      );
      expect(
        serviceTransactionRepository.updateSuccessServiceTransactionAndActivateUpgradeOrder,
      ).toHaveBeenCalledWith('st-1', sepay);
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        upgradeOrders: {
          updateMany: {
            where: { status: 'ACTIVE' },
            data: { status: 'CANCEL' },
          },
        },
      });
      expect(userRepository.updateMaxQuotaByUserId).toHaveBeenCalledWith(
        'user-1',
        BigInt(1000),
        BigInt(10),
      );
      expect(
        databaseService.applyTransactionMultipleQueries,
      ).toHaveBeenCalledWith(['deactivateQuery', 'updateQuery', 'quotaQuery']);
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
          payload: { id: 'updated-transaction' },
          userId: 'user-1',
          referenceType: 'UPGRADE_PACKAGE',
        }),
      );
    });
  });

  describe('handleDeposit', () => {
    it('should mark deposit transaction success', async () => {
      transactionRepository.updateStatusAndPayload.mockResolvedValue('ok');

      await expect(service.handleDeposit(transaction, sepay)).resolves.toBe(
        'ok',
      );
      expect(transactionRepository.updateStatusAndPayload).toHaveBeenCalledWith(
        'tr-1',
        'SUCCESS',
        sepay,
      );
    });
  });

  describe('handleWithdrawal', () => {
    it('should mark withdrawal transaction success', async () => {
      transactionRepository.updateStatusAndPayload.mockResolvedValue('ok');

      await expect(service.handleWithdrawal(transaction, sepay)).resolves.toBe(
        'ok',
      );
      expect(transactionRepository.updateStatusAndPayload).toHaveBeenCalledWith(
        'tr-1',
        'SUCCESS',
        sepay,
      );
    });
  });

  describe('handleBuy', () => {
    it('should throw TransactionNotFoundException when user to user transaction is missing', async () => {
      userToUserRepository.getById.mockResolvedValue(null);

      await expect(
        service.handleBuy(transaction, 'utu-1', sepay),
      ).rejects.toThrow(TransactionNotFoundException);
    });

    it('should throw PhotoBuyNotFoundException when photo buy is missing', async () => {
      userToUserRepository.getById.mockResolvedValue({
        id: 'utu-1',
        photoBuy: null,
      });

      await expect(
        service.handleBuy(transaction, 'utu-1', sepay),
      ).rejects.toThrow(PhotoBuyNotFoundException);
      expect(
        userToUserRepository.markSucccessAndCreateToUserTransaction,
      ).not.toHaveBeenCalled();
    });

    it('should mark buy success and notify buyer and seller', async () => {
      userToUserRepository.getById.mockResolvedValue({
        id: 'utu-1',
        toUserId: 'seller-1',
        fromUserTransaction: { user: { name: 'Buyer' } },
        photoBuy: {
          photoSellHistory: {
            width: 1920,
            height: 1080,
            originalPhotoSell: {
              photoId: 'photo-1',
              photo: { title: 'Sunset' },
            },
          },
        },
      });

      await service.handleBuy(transaction, 'utu-1', sepay);

      expect(userToUserRepository.getById).toHaveBeenCalledWith('utu-1');
      expect(
        userToUserRepository.markSucccessAndCreateToUserTransaction,
      ).toHaveBeenCalledWith(
        'utu-1',
        sepay,
        'seller-1',
        transaction.fee,
        transaction.amount,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledTimes(
        2,
      );
      expect(
        notificationService.addNotificationToQueue,
      ).toHaveBeenNthCalledWith(1, {
        title: 'Mua ảnh Sunset thành công',
        content:
          'Bạn đã thanh toán ảnh Sunset - kích thước 1920x1080 bằng QRcode thành công',
        userId: 'buyer-1',
        type: 'BOTH_INAPP_EMAIL',
        referenceType: 'CUSTOMER_PHOTO_BUY',
        payload: { id: 'photo-1' },
      });
      expect(
        notificationService.addNotificationToQueue,
      ).toHaveBeenNthCalledWith(2, {
        title: 'Bán ảnh Sunset thành công',
        content:
          ' Người dùng Buyer đã thanh toán ảnh Sunset - kích thước 1920x1080 thành công',
        userId: 'seller-1',
        type: 'BOTH_INAPP_EMAIL',
        referenceType: 'PHOTOGRAPHER_PHOTO_SELL',
        payload: { id: 'photo-1' },
      });
    });
  });
});
