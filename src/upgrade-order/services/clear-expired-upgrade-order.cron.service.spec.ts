import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { IdentityService } from 'src/authen/services/identity.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { UpgradeConstant } from 'src/upgrade-package/constants/upgrade.constant';
import { Constants } from 'src/infrastructure/utils/constants';
import { ClearExpiredUpgradeOrder } from './clear-expired-upgrade-order.cron.service';

const flushPromises = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe('ClearExpiredUpgradeOrder', () => {
  let cron: ClearExpiredUpgradeOrder;

  const upgradeOrderRepository = {
    findManyActivateAndExpired: jest.fn(),
    deactivateActivatedAndExpired: jest.fn(),
  };
  const keycloakService = { deleteRoleFromUser: jest.fn() };
  const photoRepository = { updateManyQuery: jest.fn() };
  const photoshootPackageRepository = { updateMany: jest.fn() };
  const upgradeQueue = { add: jest.fn() };

  // Wednesday
  const now = new Date('2024-05-15T09:00:00.000Z');

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ClearExpiredUpgradeOrder,
        {
          provide: UpgradePackageOrderRepository,
          useValue: upgradeOrderRepository,
        },
        { provide: IdentityService, useValue: keycloakService },
        { provide: PhotoRepository, useValue: photoRepository },
        {
          provide: PhotoshootRepository,
          useValue: photoshootPackageRepository,
        },
        {
          provide: getQueueToken(UpgradeConstant.UPGRADE_QUEUE),
          useValue: upgradeQueue,
        },
      ],
    }).compile();

    cron = moduleRef.get(ClearExpiredUpgradeOrder);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('notifyToPhotographerTheirUpgradePackageWillExpiredSoon', () => {
    it('should queue a soon-expired notification for each order', async () => {
      const orders = [{ id: 'o1' }, { id: 'o2' }];
      upgradeOrderRepository.findManyActivateAndExpired.mockResolvedValue(
        orders,
      );

      await cron.notifyToPhotographerTheirUpgradePackageWillExpiredSoon();

      expect(
        upgradeOrderRepository.findManyActivateAndExpired,
      ).toHaveBeenCalledWith(expect.any(Date));
      expect(upgradeQueue.add).toHaveBeenCalledTimes(2);
      expect(upgradeQueue.add).toHaveBeenCalledWith(
        UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY,
        { order: orders[0] },
      );
      expect(upgradeQueue.add).toHaveBeenCalledWith(
        UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY,
        { order: orders[1] },
      );
    });

    it('uses day-of-week instead of day-of-month when computing the one week later date', async () => {
      upgradeOrderRepository.findManyActivateAndExpired.mockResolvedValue([]);

      await cron.notifyToPhotographerTheirUpgradePackageWillExpiredSoon();

      const date: Date =
        upgradeOrderRepository.findManyActivateAndExpired.mock.calls[0][0];
      // current behaviour: setDate(getDay() + 7) => 3 (Wednesday) + 7 = 10th
      expect(date.getDate()).toBe(now.getDay() + 7);
      expect(upgradeQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('deactivateAndNotifyExpiredOrder', () => {
    it('should do nothing when there is no expired order', async () => {
      upgradeOrderRepository.findManyActivateAndExpired.mockResolvedValue([]);

      await cron.deactivateAndNotifyExpiredOrder();

      expect(
        upgradeOrderRepository.findManyActivateAndExpired,
      ).toHaveBeenCalledWith(now);
      expect(photoRepository.updateManyQuery).not.toHaveBeenCalled();
      expect(photoshootPackageRepository.updateMany).not.toHaveBeenCalled();
      expect(
        upgradeOrderRepository.deactivateActivatedAndExpired,
      ).not.toHaveBeenCalled();
    });

    it('should hide photos, disable packages, deactivate orders and notify users', async () => {
      const orders = [
        { id: 'o1', userId: 'u1' },
        { id: 'o2', userId: 'u2' },
      ];
      upgradeOrderRepository.findManyActivateAndExpired.mockResolvedValue(
        orders,
      );
      photoRepository.updateManyQuery.mockResolvedValue({ count: 1 });
      photoshootPackageRepository.updateMany.mockResolvedValue({ count: 1 });
      upgradeOrderRepository.deactivateActivatedAndExpired.mockResolvedValue({
        count: 2,
      });
      keycloakService.deleteRoleFromUser.mockResolvedValue(undefined);

      await cron.deactivateAndNotifyExpiredOrder();
      await flushPromises();

      const expiredFilter = {
        upgradeOrders: {
          some: {
            status: 'ACTIVE',
            expiredAt: { lte: now },
          },
        },
      };

      expect(photoRepository.updateManyQuery).toHaveBeenCalledWith({
        where: { photographer: expiredFilter },
        data: { visibility: 'PRIVATE' },
      });
      expect(photoshootPackageRepository.updateMany).toHaveBeenCalledWith(
        { user: expiredFilter },
        { status: 'DISABLED' },
      );
      expect(
        upgradeOrderRepository.deactivateActivatedAndExpired,
      ).toHaveBeenCalledWith(now);
      expect(keycloakService.deleteRoleFromUser).toHaveBeenCalledWith(
        'u1',
        Constants.PHOTOGRAPHER_ROLE,
      );
      expect(keycloakService.deleteRoleFromUser).toHaveBeenCalledWith(
        'u2',
        Constants.PHOTOGRAPHER_ROLE,
      );
      expect(upgradeQueue.add).toHaveBeenCalledWith(
        UpgradeConstant.EXPIRED_ORDER_NOTIFY,
        { order: orders[0] },
      );
      expect(upgradeQueue.add).toHaveBeenCalledWith(
        UpgradeConstant.EXPIRED_ORDER_NOTIFY,
        { order: orders[1] },
      );
    });
  });
});
