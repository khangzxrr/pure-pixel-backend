import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import OneSignal = require('@onesignal/node-onesignal');
import { NotificationRepository } from 'src/database/repositories/notification.repository';
import { NotificationConstant } from '../constants/notification.constant';
import { NotificationDto } from '../dtos/notification.dto';
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationFindAllDto } from '../dtos/rest/notification-find-all.request.dto';
import { NotificationFindAllResponseDto } from '../dtos/rest/notification-find-all.response.dto';
import { NotificationService } from './notification.service';

const mockCreateConfiguration = jest.fn();
const mockCreateNotification = jest.fn();
const mockDefaultApi = jest.fn();

jest.mock('@onesignal/node-onesignal', () => ({
  createConfiguration: (options: object) => mockCreateConfiguration(options),
  DefaultApi: function DefaultApi(config: object) {
    mockDefaultApi(config);
    return { createNotification: mockCreateNotification };
  },
  Notification: class Notification {},
}));

describe('NotificationService', () => {
  const originalEnv = { ...process.env };

  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let notificationRepository: jest.Mocked<
    Pick<NotificationRepository, 'count' | 'findAll' | 'create'>
  >;
  let queue: jest.Mocked<Pick<Queue, 'add'>>;
  let service: NotificationService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    process.env.ONESIGNAL_APP_ID = 'app-id';
    process.env.ONESIGNAL_USER_AUTH_KEY = 'user-auth';
    process.env.ONESIGNAL_REST_API_KEY = 'rest-key';
    process.env.SMTP_USERNAME = 'noreply@purepixel.test';

    mockCreateConfiguration.mockReset().mockReturnValue({ cfg: true });
    mockCreateNotification.mockReset().mockResolvedValue({ id: 'n1' });
    mockDefaultApi.mockReset();

    mailerService = { sendMail: jest.fn() };
    notificationRepository = {
      count: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    };
    queue = { add: jest.fn() };

    service = new NotificationService(
      mailerService as unknown as MailerService,
      notificationRepository as unknown as NotificationRepository,
      queue as unknown as Queue,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('findAll', () => {
    it('should return paginated notifications of user', async () => {
      notificationRepository.count.mockResolvedValue(11);
      notificationRepository.findAll.mockResolvedValue([
        { id: 'n1', userId: 'u1', title: 't' },
      ] as never);

      const dto = Object.assign(new NotificationFindAllDto(), {
        limit: 5,
        page: 2,
      });

      const result = await service.findAll('u1', dto);

      expect(notificationRepository.count).toHaveBeenCalledWith({
        userId: 'u1',
      });
      expect(notificationRepository.findAll).toHaveBeenCalledWith(10, 5, {
        userId: 'u1',
      });
      expect(result).toBeInstanceOf(NotificationFindAllResponseDto);
      expect(result.totalPage).toBe(3);
      expect(result.objects[0]).toBeInstanceOf(NotificationDto);
    });
  });

  describe('saveNotification', () => {
    it('should create notification with SHOW status', async () => {
      notificationRepository.create.mockResolvedValue({ id: 'n1' } as never);

      const result = await service.saveNotification({
        content: 'c',
        title: 't',
        type: 'EMAIL',
        status: 'HIDE' as never,
        referenceType: 'CHAT',
        payload: { a: 1 },
        user: { connect: { id: 'u1' } },
      });

      expect(notificationRepository.create).toHaveBeenCalledWith({
        content: 'c',
        title: 't',
        type: 'EMAIL',
        status: 'SHOW',
        referenceType: 'CHAT',
        payload: { a: 1 },
        user: { connect: { id: 'u1' } },
      });
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('createTextNotification', () => {
    it('should build onesignal notification', () => {
      const notification = service.createTextNotification(
        'name-1',
        'Hello',
        'World',
      );

      expect(notification.app_id).toBe('app-id');
      expect(notification.name).toBe('name-1');
      expect(notification.headings).toEqual({ en: 'Hello', vi: 'Hello' });
      expect(notification.contents?.en).toBe('World');
    });
  });

  describe('sendEmailNotification', () => {
    it('should skip sending when there is no valid email', async () => {
      await service.sendEmailNotification('t', 'c', ['', '']);

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should send mail to non empty emails', async () => {
      mailerService.sendMail.mockResolvedValue({});

      await service.sendEmailNotification('Subject', 'Body', [
        'a@test.com',
        '',
        'b@test.com',
      ]);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: ['a@test.com', 'b@test.com'],
        from: 'noreply@purepixel.test',
        subject: 'Subject',
        text: 'Body',
        html: '<b>Body</b>',
      });
    });

    it('should propagate mailer errors', async () => {
      mailerService.sendMail.mockRejectedValue(new Error('smtp'));

      await expect(
        service.sendEmailNotification('t', 'c', ['a@test.com']),
      ).rejects.toThrow('smtp');
    });
  });

  describe('sendPushNotification', () => {
    it('should target user external id through push channel', async () => {
      const notification = new OneSignal.Notification();

      await service.sendPushNotification('u1', notification);

      expect(mockCreateConfiguration).toHaveBeenCalledWith({
        userAuthKey: 'user-auth',
        restApiKey: 'rest-key',
      });
      expect(mockDefaultApi).toHaveBeenCalledWith({ cfg: true });
      expect(notification.include_aliases).toEqual({ external_id: ['u1'] });
      expect(notification.target_channel).toBe('push');
      expect(mockCreateNotification).toHaveBeenCalledWith(notification);
    });

    it('should propagate onesignal errors', async () => {
      mockCreateNotification.mockRejectedValue(new Error('onesignal'));

      await expect(
        service.sendPushNotification('u1', new OneSignal.Notification()),
      ).rejects.toThrow('onesignal');
    });
  });

  describe('addNotificationToQueue', () => {
    it('should add text notification job with options', async () => {
      const job = { id: 'job1' };
      queue.add.mockResolvedValue(job as never);

      const dto: NotificationCreateDto = {
        userId: 'u1',
        title: 't',
        content: 'c',
        type: 'IN_APP',
        referenceType: 'CHAT',
        payload: {},
      };

      const result = await service.addNotificationToQueue(dto, { delay: 5 });

      expect(queue.add).toHaveBeenCalledWith(
        NotificationConstant.TEXT_NOTIFICATION_JOB,
        dto,
        { delay: 5 },
      );
      expect(result).toBe(job);
    });
  });
});
