import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { App } from '@onesignal/node-onesignal';
import OneSignal = require('@onesignal/node-onesignal');
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationRepository } from 'src/database/repositories/notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private oneSignalClient: Promise<App> = null;

  constructor(
    private readonly mailerService: MailerService,
    @Inject() private readonly notificationRepository: NotificationRepository,
  ) {}

  client() {
    const config = OneSignal.createConfiguration({
      userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
      restApiKey: process.env.ONESIGNAL_REST_API_KEY,
    });

    return new OneSignal.DefaultApi(config);
  }

  async getApp(): Promise<App> {
    if (this.oneSignalClient) {
      return this.oneSignalClient;
    }

    this.oneSignalClient = this.client().getApp(process.env.ONESIGNAL_APP_ID);

    return this.oneSignalClient;
  }

  async saveNotification(notificationCreateDto: NotificationCreateDto) {
    return this.notificationRepository.create({
      content: notificationCreateDto.content,
      title: notificationCreateDto.title,
      type: notificationCreateDto.type,
      status: 'SHOW',
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

  async sendEmailNotification(title: string, content: string, email: string[]) {
    await this.mailerService.sendMail({
      to: email,
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

    const notificationResponse =
      await this.client().createNotification(notification);

    this.logger.log(`sent notification to ${userId}`);
    this.logger.log(notificationResponse);
  }
}
