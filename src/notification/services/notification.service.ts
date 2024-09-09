import { Injectable } from '@nestjs/common';
import OneSignal = require('@onesignal/node-onesignal');

@Injectable()
export class NotificationService {
  client() {
    const config = OneSignal.createConfiguration({
      userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
      restApiKey: process.env.ONESIGNAL_REST_API_KEY,
    });

    return new OneSignal.DefaultApi(config);
  }

  async getApp() {
    return this.client().getApp(process.env.ONESIGNAL_APP_ID);
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

  async sendToSpecificUserByUserId(userid: string) {
    const notification = this.createTextNotification(
      'test',
      'english title',
      'vietnamese title',
      'en content',
      'vi content',
    );
    notification.include_aliases = {
      external_id: [userid],
    };

    notification.target_channel = 'push';

    const notificationResponse =
      await this.client().createNotification(notification);

    console.log(notificationResponse);
  }
}
