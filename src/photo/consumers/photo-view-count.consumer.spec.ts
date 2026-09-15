import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoConstant } from '../constants/photo.constant';
import { PhotoViewCountConsumer } from './photo-view-count.consumer';

type UpdatedPhoto = Awaited<ReturnType<PhotoRepository['updateById']>>;

describe('PhotoViewCountConsumer', () => {
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'updateById'>>;
  let consumer: PhotoViewCountConsumer;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    photoRepository = {
      updateById: jest.fn().mockResolvedValue({} as UpdatedPhoto),
    };
    consumer = new PhotoViewCountConsumer(
      photoRepository as unknown as PhotoRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('increments view count for INCREASE_VIEW_COUNT_JOB', async () => {
    const job = {
      name: PhotoConstant.INCREASE_VIEW_COUNT_JOB,
      data: { id: 'photo-1' },
    } as Job;

    await expect(consumer.process(job)).resolves.toBeNull();
    expect(photoRepository.updateById).toHaveBeenCalledWith('photo-1', {
      viewCount: { increment: 1 },
    });
  });

  it('ignores unknown jobs', async () => {
    const job = { name: 'UNKNOWN', data: {} } as Job;

    await expect(consumer.process(job)).resolves.toBeNull();
    expect(photoRepository.updateById).not.toHaveBeenCalled();
  });

  it('throws an error so the job is retried when update fails', async () => {
    photoRepository.updateById.mockRejectedValue(new Error('db'));
    const job = {
      name: PhotoConstant.INCREASE_VIEW_COUNT_JOB,
      data: { id: 'photo-1' },
    } as Job;

    await expect(consumer.process(job)).rejects.toThrow(Error);
  });
});
