import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationConstant } from '../constants/notification.constant';
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationGateway } from '../gateways/notification.gateway';
import { NotificationService } from '../services/notification.service';
import { NotificationConsumer } from './notification.consumer';

jest.mock('uuid', () => ({
  v4: () => 'notification-uuid',
}));

describe('NotificationConsumer', () => {
  let notificationService: jest.Mocked<
    Pick<
      NotificationService,
      | 'createTextNotification'
      | 'saveNotification'
      | 'sendPushNotification'
      | 'sendEmailNotification'
    >
  >;
  let notificationGateway: jest.Mocked<
    Pick<NotificationGateway, 'sendRefreshNotificationEvent'>
  >;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findUnique'>>;
  let consumer: NotificationConsumer;

  const oneSignalNotification = { name: 'notification-uuid' };

  const makeDto = (
    type: NotificationCreateDto['type'],
  ): NotificationCreateDto => ({
    userId: 'u1',
    title: 'Title',
    content: 'Content',
    type,
    referenceType: 'CHAT',
    payload: { id: 'x' },
  });

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    notificationService = {
      createTextNotification: jest.fn().mockReturnValue(oneSignalNotification),
      saveNotification: jest.fn().mockResolvedValue({ id: 'saved' }),
      sendPushNotification: jest.fn(),
      sendEmailNotification: jest.fn(),
    };
    notificationGateway = {
      sendRefreshNotificationEvent: jest.fn(),
    };
    userRepository = {
      findUnique: jest.fn(),
    };

    consumer = new NotificationConsumer(
      notificationService as unknown as NotificationService,
      notificationGateway as unknown as NotificationGateway,
      userRepository as unknown as UserRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('process', () => {
    it('should send notification for text notification job', async () => {
      const spy = jest
        .spyOn(consumer, 'sendNotification')
        .mockResolvedValue(undefined);
      const dto = makeDto('IN_APP');

      await expect(
        consumer.process({
          name: NotificationConstant.TEXT_NOTIFICATION_JOB,
          data: dto,
        } as unknown as Job),
      ).resolves.toBeNull();
      expect(spy).toHaveBeenCalledWith(dto);
    });

    it('should ignore unknown jobs', async () => {
      const spy = jest.spyOn(consumer, 'sendNotification');

      await expect(
        consumer.process({ name: 'OTHER', data: {} } as unknown as Job),
      ).resolves.toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw to trigger retry when sending fails', async () => {
      jest
        .spyOn(consumer, 'sendNotification')
        .mockRejectedValue(new Error('fail'));

      await expect(
        consumer.process({
          name: NotificationConstant.TEXT_NOTIFICATION_JOB,
          data: makeDto('EMAIL'),
        } as unknown as Job),
      ).rejects.toBeInstanceOf(Error);
    });
  });

  describe('sendNotification', () => {
    it('should stop when user is not found', async () => {
      userRepository.findUnique.mockResolvedValue(null);

      await consumer.sendNotification(makeDto('BOTH_INAPP_EMAIL'));

      expect(userRepository.findUnique).toHaveBeenCalledWith('u1', {});
      expect(Logger.prototype.warn).toHaveBeenCalled();
      expect(notificationService.saveNotification).not.toHaveBeenCalled();
      expect(
        notificationGateway.sendRefreshNotificationEvent,
      ).not.toHaveBeenCalled();
    });

    describe('with existing user', () => {
      beforeEach(() => {
        userRepository.findUnique.mockResolvedValue({
          id: 'u1',
          mail: 'u1@test.com',
        } as never);
      });

      it('should save, emit and push for IN_APP', async () => {
        await consumer.sendNotification(makeDto('IN_APP'));

        expect(notificationService.createTextNotification).toHaveBeenCalledWith(
          'notification-uuid',
          'Title',
          'Content',
        );
        expect(notificationService.saveNotification).toHaveBeenCalledWith({
          payload: { id: 'x' },
          type: 'IN_APP',
          referenceType: 'CHAT',
          user: { connect: { id: 'u1' } },
          title: 'Title',
          content: 'Content',
          status: 'SHOW',
        });
        expect(
          notificationGateway.sendRefreshNotificationEvent,
        ).toHaveBeenCalledWith('u1', {
          referenceType: 'CHAT',
          title: 'Title',
          content: 'Content',
        });
        expect(notificationService.sendPushNotification).toHaveBeenCalledWith(
          'u1',
          oneSignalNotification,
        );
        expect(
          notificationService.sendEmailNotification,
        ).not.toHaveBeenCalled();
      });

      it('should only send email for EMAIL', async () => {
        await consumer.sendNotification(makeDto('EMAIL'));

        expect(notificationService.sendPushNotification).not.toHaveBeenCalled();
        expect(notificationService.sendEmailNotification).toHaveBeenCalledWith(
          'Title',
          'Content',
          ['u1@test.com'],
        );
      });

      it('should send push and email for BOTH_INAPP_EMAIL', async () => {
        await consumer.sendNotification(makeDto('BOTH_INAPP_EMAIL'));

        expect(notificationService.sendPushNotification).toHaveBeenCalled();
        expect(notificationService.sendEmailNotification).toHaveBeenCalled();
      });

      it('should propagate save errors before emitting', async () => {
        notificationService.saveNotification.mockRejectedValue(new Error('db'));

        await expect(
          consumer.sendNotification(makeDto('IN_APP')),
        ).rejects.toThrow('db');
        expect(
          notificationGateway.sendRefreshNotificationEvent,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
