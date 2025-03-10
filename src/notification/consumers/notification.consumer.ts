import { Processor, WorkerHost } from '@nestjs/bullmq';
import { NotificationConstant } from '../constants/notification.constant';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { v4 } from 'uuid';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationGateway } from '../gateways/notification.gateway';

@Processor(NotificationConstant.NOTIFICATION_QUEUE)
export class NotificationConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    @Inject() private readonly notificationService: NotificationService,
    @Inject() private readonly notificationGateway: NotificationGateway,
    @Inject() private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case NotificationConstant.TEXT_NOTIFICATION_JOB:
          await this.sendNotification(job.data);
          break;
        default:
          break;
      }
    } catch (e) {
      console.log(e);
      throw new Error(); //retry
    }

    return null;
  }

  async sendNotification(notificationCreateDto: NotificationCreateDto) {
    const user = await this.userRepository.findUnique(
      notificationCreateDto.userId,
      {},
    );

    if (!user) {
      this.logger.warn(
        `user with id ${notificationCreateDto.userId} is not found`,
      );
      return;
    }

    const uuid = v4();

    const notification = this.notificationService.createTextNotification(
      uuid,
      notificationCreateDto.title,
      notificationCreateDto.content,
    );

    const savedNotification = await this.notificationService.saveNotification({
      payload: notificationCreateDto.payload,
      type: notificationCreateDto.type,
      referenceType: notificationCreateDto.referenceType,
      user: {
        connect: {
          id: user.id,
        },
      },
      title: notificationCreateDto.title,
      content: notificationCreateDto.content,
      status: 'SHOW',
    });

    await this.notificationGateway.sendRefreshNotificationEvent(user.id, {
      referenceType: notificationCreateDto.referenceType,
      title: notificationCreateDto.title,
      content: notificationCreateDto.content,
      //only need referenceType
    });

    if (
      notificationCreateDto.type === 'IN_APP' ||
      notificationCreateDto.type === 'BOTH_INAPP_EMAIL'
    ) {
      await this.notificationService.sendPushNotification(
        user.id,
        notification,
      );
    }

    if (
      notificationCreateDto.type === 'EMAIL' ||
      notificationCreateDto.type === 'BOTH_INAPP_EMAIL'
    ) {
      await this.notificationService.sendEmailNotification(
        notificationCreateDto.title,
        notificationCreateDto.content,
        [user.mail],
      );
    }

    this.logger.log(
      `sent ${notificationCreateDto.type} notification to userId: ${user.id}`,
    );
  }
}
