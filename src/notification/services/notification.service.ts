import { Injectable, Logger } from '@nestjs/common';
import { App } from '@onesignal/node-onesignal';
import OneSignal = require('@onesignal/node-onesignal');

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private oneSignalClient: Promise<App> = null;

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

  createTextNotification(
    name: string,
    titleEn: string,
    titleVi: string,
    en: string,
    vi: string,
  ) {
    const notification = new OneSignal.Notification();

    notification.app_id = process.env.ONESIGNAL_APP_ID;
    notification.name = name;
    notification.headings = {
      en: titleEn,
      vi: titleVi,
    };
    notification.contents = {
      en,
      vi,
    };

    return notification;
  }

  async sendToSpecificUserByUserId(
    userid: string,
    notification: OneSignal.Notification,
  ) {
    notification.include_aliases = {
      external_id: [userid],
    };

    notification.target_channel = 'push';

    const notificationResponse =
      await this.client().createNotification(notification);

    this.logger.log(`sent notification to ${userid}`);
    this.logger.log(notificationResponse);
  }
}
