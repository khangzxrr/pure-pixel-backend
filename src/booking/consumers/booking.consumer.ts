import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BookingConstant } from '../constants/booking.constant';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';

import { BookingRepository } from 'src/database/repositories/booking.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PrismaService } from 'src/prisma.service';
import { NotificationService } from 'src/notification/services/notification.service';

@Processor(BookingConstant.BOOKING_QUEUE)
export class BookingConsumer extends WorkerHost {
  private logger = new Logger(BookingConsumer.name);

  constructor(
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly prisma: PrismaService,
    @Inject() private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      default:
        this.logger.error(`unknow job name: ${job.name}`);
    }
  }
}
