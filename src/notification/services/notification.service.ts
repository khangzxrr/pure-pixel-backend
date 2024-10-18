import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { App } from '@onesignal/node-onesignal';
import OneSignal = require('@onesignal/node-onesignal');
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationRepository } from 'src/database/repositories/notification.repository';
import { NotificationFindAllDto } from '../dtos/rest/notification-find-all.request.dto';
import { NotificationFindAllResponseDto } from '../dtos/rest/notification-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { NotificationDto } from '../dtos/notification.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationConstant } from '../constants/notification.constant';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private oneSignalClient: Promise<App> = null;

  constructor(
    private readonly mailerService: MailerService,
    @Inject() private readonly notificationRepository: NotificationRepository,
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly queue: Queue,
  ) {}

  private client() {
    const config = OneSignal.createConfiguration({
      userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
      restApiKey: process.env.ONESIGNAL_REST_API_KEY,
    });

    return new OneSignal.DefaultApi(config);
  }

  private async getApp(): Promise<App> {
    if (this.oneSignalClient) {
      return this.oneSignalClient;
    }

    this.oneSignalClient = this.client().getApp(process.env.ONESIGNAL_APP_ID);

    return this.oneSignalClient;
  }

  async findAll(
    userId: string,
    notificationFindAllDto: NotificationFindAllDto,
  ) {
    const count = await this.notificationRepository.count({
      userId,
    });

    const notifications = await this.notificationRepository.findAll(
      notificationFindAllDto.toSkip(),
      notificationFindAllDto.limit,
      {
        userId,
      },
    );

    const notificationDtos = plainToInstance(NotificationDto, notifications);

    return new NotificationFindAllResponseDto(
      notificationFindAllDto.limit,
      count,
      notificationDtos,
    );
  }

  async saveNotification(notificationCreateDto: NotificationCreateDto) {
    return this.notificationRepository.create({
      content: notificationCreateDto.content,
      title: notificationCreateDto.title,
      type: notificationCreateDto.type,
      status: 'SHOW',
      referenceType: notificationCreateDto.referenceType,
      referenceId: notificationCreateDto.referenceId,
      user: {
        connect: {
          id: notificationCreateDto.userId,
        },
      },
    });
  }

  createTextNotification(name: string, title: string, content: string) {
    const notification = new OneSignal.Notification();

    notification.app_id = process.env.ONESIGNAL_APP_ID;
    notification.name = name;
    notification.headings = {
      en: title,
      vi: title,
    };
    notification.contents = {
      en: content,
      vi: title,
    };

    return notification;
  }

  async sendEmailNotification(
    title: string,
    content: string,
    emails: string[],
  ) {
    const filterNotEmptyEmails = emails.filter((m) => m.length !== 0);

    this.logger.log(`send mail to emails: ${filterNotEmptyEmails}`);

    if (filterNotEmptyEmails.length === 0) {
      return;
    }

    await this.mailerService.sendMail({
      to: filterNotEmptyEmails,
      from: process.env.SMTP_USERNAME,
      subject: title,
      text: content,
      html: `<b>${content}</b>`,
    });
  }

  async sendPushNotification(
    userId: string,
    notification: OneSignal.Notification,
  ) {
    notification.include_aliases = {
      external_id: [userId],
    };

    notification.target_channel = 'push';

    await this.client().createNotification(notification);
  }

  async addNotificationToQueue(notificationDto: NotificationCreateDto) {
    console.log(notificationDto);
    return await this.queue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationDto,
    );
  }
}
