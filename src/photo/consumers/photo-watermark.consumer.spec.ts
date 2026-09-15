import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoConstant } from '../constants/photo.constant';
import { PhotoGateway } from '../gateways/photo.gateway';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoWatermarkConsumer } from './photo-watermark.consumer';

describe('PhotoWatermarkConsumer', () => {
  let photoGateway: jest.Mocked<
    Pick<PhotoGateway, 'sendFinishWatermarkEventToUserId'>
  >;
  let consumer: PhotoWatermarkConsumer;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    photoGateway = {
      sendFinishWatermarkEventToUserId: jest.fn().mockResolvedValue(undefined),
    };
    consumer = new PhotoWatermarkConsumer(
      photoGateway as unknown as PhotoGateway,
      {} as PhotoRepository,
      {} as PhotoProcessService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('processes GENERATE_WATERMARK_JOB and notifies the user', async () => {
    const job = {
      name: PhotoConstant.GENERATE_WATERMARK_JOB,
      data: { userId: 'u1', generateWatermarkRequest: { text: 'PXL' } },
    } as Job;

    await consumer.process(job);

    expect(photoGateway.sendFinishWatermarkEventToUserId).toHaveBeenCalledWith(
      'u1',
      undefined,
    );
  });

  it('ignores unknown jobs', async () => {
    await consumer.process({ name: 'OTHER', data: {} } as Job);

    expect(
      photoGateway.sendFinishWatermarkEventToUserId,
    ).not.toHaveBeenCalled();
  });

  it('rethrows an error to retry the job when processing fails', async () => {
    photoGateway.sendFinishWatermarkEventToUserId.mockRejectedValue(
      new Error('socket'),
    );
    const job = {
      name: PhotoConstant.GENERATE_WATERMARK_JOB,
      data: { userId: 'u1', generateWatermarkRequest: { text: 'PXL' } },
    } as Job;

    await expect(consumer.process(job)).rejects.toThrow(Error);
  });
});
