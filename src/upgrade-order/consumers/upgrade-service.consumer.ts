import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UpgradeConstant } from '../../upgrade-package/constants/upgrade.constant';
import { Inject, Logger } from '@nestjs/common';
import { NotificationService } from 'src/notification/services/notification.service';
import { UpgradeOrder } from '@prisma/client';

@Processor(UpgradeConstant.UPGRADE_QUEUE)
export class UpgradeServiceConsumer extends WorkerHost {
  private readonly logger: Logger = new Logger(UpgradeServiceConsumer.name);
  constructor(
    @Inject() private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async sendSoonExpiredOrderNotification(order: UpgradeOrder) {
    try {
      const notification = this.notificationService.createTextNotification(
        UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY,
        'Gói nâng cấp của bạn sắp hết hạn!',
        'Vui lòng cân nhắc gia hạn gói nâng cấp để tiếp tục nhận được lợi ích của gói',
      );

      await this.notificationService.sendPushNotification(
        order.userId,
        notification,
      );
    } catch (error) {
      console.log(error);
    }
  }

  async sendExpiredOrderNotification(order: UpgradeOrder) {
    try {
      const notification = this.notificationService.createTextNotification(
        UpgradeConstant.EXPIRED_ORDER_NOTIFY,
        'Gói nâng cấp của bạn đã hết hạn',
        'Vui lòng gia hạn lại để được nhận các ưu đãi từ gói nâng cấp!',
      );

      await this.notificationService.sendPushNotification(
        order.userId,
        notification,
      );
    } catch (error) {
      console.log(error);
    }
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY:
        this.logger.log(
          `send SOON_EXPIRED_ORDER_NOTIFY for order id ${job.data.order.id}`,
        );
        await this.sendSoonExpiredOrderNotification(job.data.order);
        break;
      case UpgradeConstant.EXPIRED_ORDER_NOTIFY:
        this.logger.log(
          `send ${UpgradeConstant.EXPIRED_ORDER_NOTIFY} for order id ${job.data.order.id}`,
        );
        await this.sendExpiredOrderNotification(job.data.order);
        break;
    }

    return null;
  }
}
