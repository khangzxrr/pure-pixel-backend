import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { UpgradeConstant } from '../../upgrade-package/constants/upgrade.constant';
import { Inject, Logger } from '@nestjs/common';
import { UpgradeOrder } from '@prisma/client';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

export interface OrderNotifyJobData {
  order: UpgradeOrder;
}

export interface RestorePhotoVisibilityJobData {
  photographerId: string;
}

//SOON_EXPIRED_ORDER_NOTIFY, EXPIRED_ORDER_NOTIFY: OrderNotifyJobData
//RESTORE_PHOTO_VISIBILITY: RestorePhotoVisibilityJobData
//the job name constants are typed as string, so each case narrows the data explicitly
export type UpgradeJobData = OrderNotifyJobData | RestorePhotoVisibilityJobData;

@Processor(UpgradeConstant.UPGRADE_QUEUE)
export class UpgradeServiceConsumer extends WorkerHost {
  private readonly logger: Logger = new Logger(UpgradeServiceConsumer.name);
  constructor(
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    @Inject() private readonly photoRepository: PhotoRepository,
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

  async restorePhotoVisibility(photographerId: string) {
    const updateManyPhoto = await this.photoRepository.updateManyQuery({
      where: {
        photographerId,
        photoSellings: {
          some: {
            active: true,
          },
        },
      },
      data: {
        visibility: 'PUBLIC',
      },
    });

    this.logger.log(
      `restore public of ${updateManyPhoto.count} photos, photoshoot package of photographerId ${photographerId}`,
    );
  }

  async process(job: Job<UpgradeJobData>): Promise<null> {
    switch (job.name) {
      case UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY: {
        const data = job.data as OrderNotifyJobData;
        this.logger.log(
          `send SOON_EXPIRED_ORDER_NOTIFY for order id ${data.order.id}`,
        );
        await this.sendSoonExpiredOrderNotification(data.order);
        break;
      }
      case UpgradeConstant.EXPIRED_ORDER_NOTIFY: {
        const data = job.data as OrderNotifyJobData;
        this.logger.log(
          `send ${UpgradeConstant.EXPIRED_ORDER_NOTIFY} for order id ${data.order.id}`,
        );
        await this.sendExpiredOrderNotification(data.order);
        break;
      }
      case UpgradeConstant.RESTORE_PHOTO_VISIBILITY:
        this.logger.log(`restore photo visibility`);
        await this.restorePhotoVisibility(
          (job.data as RestorePhotoVisibilityJobData).photographerId,
        );
        break;
    }

    return null;
  }
}
