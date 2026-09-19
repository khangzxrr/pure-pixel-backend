import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UpgradeOrder } from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { UpgradeConstant } from 'src/upgrade-package/constants/upgrade.constant';
import { UpgradeServiceConsumer } from './upgrade-service.consumer';

describe('UpgradeServiceConsumer', () => {
  let consumer: UpgradeServiceConsumer;

  const notificationQueue = { add: jest.fn() };
  const photoRepository = { updateManyQuery: jest.fn() };

  const order: UpgradeOrder = {
    id: 'order-1',
    userId: 'user-1',
    status: 'ACTIVE',
    upgradePackageHistoryId: 'history-1',
    expiredAt: new Date('2024-02-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as unknown as UpgradeOrder;

  const makeJob = (name: string, data: unknown) =>
    ({ name, data }) as unknown as Job;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpgradeServiceConsumer,
        {
          provide: getQueueToken(NotificationConstant.NOTIFICATION_QUEUE),
          useValue: notificationQueue,
        },
        { provide: PhotoRepository, useValue: photoRepository },
      ],
    }).compile();

    consumer = moduleRef.get(UpgradeServiceConsumer);
  });

  it('should send soon expired notification', async () => {
    await consumer.sendSoonExpiredOrderNotification(order);

    expect(notificationQueue.add).toHaveBeenCalledWith(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      expect.objectContaining({
        userId: 'user-1',
        referenceType: 'UPGRADE_PACKAGE',
        type: 'BOTH_INAPP_EMAIL',
        title: 'Gói nâng cấp của bạn sắp hết hạn',
        payload: order,
      }),
    );
  });

  it('should send expired notification', async () => {
    await consumer.sendExpiredOrderNotification(order);

    expect(notificationQueue.add).toHaveBeenCalledWith(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      expect.objectContaining({
        userId: 'user-1',
        title: 'Gói nâng cấp của bạn đã hết hạn',
        payload: order,
      }),
    );
  });

  it('should restore photo visibility of photographer', async () => {
    photoRepository.updateManyQuery.mockResolvedValue({ count: 3 });

    await consumer.restorePhotoVisibility('photographer-1');

    expect(photoRepository.updateManyQuery).toHaveBeenCalledWith({
      where: {
        photographerId: 'photographer-1',
        photoSellings: { some: { active: true } },
      },
      data: { visibility: 'PUBLIC' },
    });
  });

  describe('process', () => {
    it('should handle SOON_EXPIRED_ORDER_NOTIFY job', async () => {
      const spy = jest.spyOn(consumer, 'sendSoonExpiredOrderNotification');

      const result = await consumer.process(
        makeJob(UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY, { order }),
      );

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith(order);
    });

    it('should handle EXPIRED_ORDER_NOTIFY job', async () => {
      const spy = jest.spyOn(consumer, 'sendExpiredOrderNotification');

      await consumer.process(
        makeJob(UpgradeConstant.EXPIRED_ORDER_NOTIFY, { order }),
      );

      expect(spy).toHaveBeenCalledWith(order);
    });

    it('should handle RESTORE_PHOTO_VISIBILITY job', async () => {
      photoRepository.updateManyQuery.mockResolvedValue({ count: 0 });
      const spy = jest.spyOn(consumer, 'restorePhotoVisibility');

      await consumer.process(
        makeJob(UpgradeConstant.RESTORE_PHOTO_VISIBILITY, {
          photographerId: 'photographer-1',
        }),
      );

      expect(spy).toHaveBeenCalledWith('photographer-1');
    });

    it('should ignore unknown job', async () => {
      const result = await consumer.process(makeJob('UNKNOWN', {}));

      expect(result).toBeNull();
      expect(notificationQueue.add).not.toHaveBeenCalled();
      expect(photoRepository.updateManyQuery).not.toHaveBeenCalled();
    });
  });
});
