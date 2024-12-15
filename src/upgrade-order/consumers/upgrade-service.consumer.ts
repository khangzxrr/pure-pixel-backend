import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { UpgradeConstant } from '../../upgrade-package/constants/upgrade.constant';
import { Logger } from '@nestjs/common';
import { UpgradeOrder } from '@prisma/client';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';

@Processor(UpgradeConstant.UPGRADE_QUEUE)
export class UpgradeServiceConsumer extends WorkerHost {
  private readonly logger: Logger = new Logger(UpgradeServiceConsumer.name);
  constructor(
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async sendSoonExpiredOrderNotification(order: UpgradeOrder) {
    const notificationCreateDto: NotificationCreateDto = {
      userId: order.userId,
      referenceType: 'UPGRADE_PACKAGE',
      type: 'BOTH_INAPP_EMAIL',
      title: 'Gói nâng cấp của bạn sắp hết hạn',
      content:
        'Vui lòng cân nhắc gia hạn gói nâng cấp để tiếp tục nhận được lợi ích của gói',
      payload: order,
    };

    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationCreateDto,
    );
  }

  async sendExpiredOrderNotification(order: UpgradeOrder) {
    const notificationCreateDto: NotificationCreateDto = {
      userId: order.userId,
      referenceType: 'UPGRADE_PACKAGE',

      type: 'BOTH_INAPP_EMAIL',
      title: 'Gói nâng cấp của bạn đã hết hạn',
      payload: order,
      content: 'Vui lòng gia hạn lại để được nhận các ưu đãi từ gói nâng cấp!',
    };

    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationCreateDto,
    );
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
