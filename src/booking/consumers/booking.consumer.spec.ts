import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookingConsumer } from './booking.consumer';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PrismaService } from 'src/prisma.service';
import { NotificationService } from 'src/notification/services/notification.service';

describe('BookingConsumer', () => {
  let consumer: BookingConsumer;

  beforeEach(() => {
    consumer = new BookingConsumer(
      {} as unknown as BookingRepository,
      {} as unknown as PhotoRepository,
      {} as unknown as UserRepository,
      {} as unknown as PrismaService,
      {} as unknown as NotificationService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log an error for unknown job names', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      consumer.process({ name: 'UNKNOWN_JOB' } as unknown as Job),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('unknow job name: UNKNOWN_JOB');
  });
});
