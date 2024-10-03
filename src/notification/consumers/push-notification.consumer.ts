import { Processor, WorkerHost } from '@nestjs/bullmq';
import { NotificationConstant } from '../constants/notification.constant';
import { Job } from 'bullmq';

@Processor(NotificationConstant.PUSH_NOTIFICATION_QUEUE)
export class PushNotificationConsumer extends WorkerHost {
  process(job: Job): Promise<any> {
    console.log(job);

    return null;
  }
}
