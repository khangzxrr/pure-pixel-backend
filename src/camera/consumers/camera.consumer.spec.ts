import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { MissingMakeExifException } from 'src/photo/exceptions/missing-make-exif.exception';
import { MissingModelExifException } from 'src/photo/exceptions/missing-model-exif.exception';
import { CameraConstant } from '../constants/camera.constant';
import { CameraConsumer } from './camera.consumer';

describe('CameraConsumer', () => {
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findUniqueOrThrow'>>;
  let cameraOnUsersRepository: jest.Mocked<
    Pick<CameraOnUsersRepository, 'create'>
  >;
  let cameraRepository: jest.Mocked<Pick<CameraRepository, 'upsert'>>;
  let consumer: CameraConsumer;

  const makeJob = (name: string, data: object) =>
    ({ name, data }) as unknown as Job;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    photoRepository = { findUniqueOrThrow: jest.fn() };
    cameraOnUsersRepository = { create: jest.fn() };
    cameraRepository = { upsert: jest.fn() };

    consumer = new CameraConsumer(
      photoRepository as unknown as PhotoRepository,
      cameraOnUsersRepository as unknown as CameraOnUsersRepository,
      cameraRepository as unknown as CameraRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('process', () => {
    it('should process camera usage job', async () => {
      const spy = jest
        .spyOn(consumer, 'processCamera')
        .mockResolvedValue(undefined);

      await consumer.process(
        makeJob(CameraConstant.ADD_NEW_CAMERA_USAGE_JOB, { photoId: 'p1' }),
      );

      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('should ignore unknown jobs', async () => {
      const spy = jest.spyOn(consumer, 'processCamera');

      await expect(
        consumer.process(makeJob('UNKNOWN', {})),
      ).resolves.toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw to trigger retry when processing fails', async () => {
      jest
        .spyOn(consumer, 'processCamera')
        .mockRejectedValue(new Error('boom'));

      await expect(
        consumer.process(
          makeJob(CameraConstant.ADD_NEW_CAMERA_USAGE_JOB, { photoId: 'p1' }),
        ),
      ).rejects.toBeInstanceOf(Error);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('processCamera', () => {
    it('should upsert camera and link it to photographer', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        photographerId: 'u1',
        exif: { Model: 'X-T5', Make: 'Fujifilm' },
      } as never);
      cameraRepository.upsert.mockResolvedValue({ id: 'c1' } as never);

      await consumer.processCamera('p1');

      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p1');
      expect(cameraRepository.upsert).toHaveBeenCalledWith(
        'X-T5',
        'Fujifilm',
        'p1',
      );
      expect(cameraOnUsersRepository.create).toHaveBeenCalledWith('c1', 'u1');
    });

    it.each([
      ['null exif', null],
      ['array exif', [{ Model: 'X' }]],
      ['string exif', 'exif'],
      ['missing model', { Make: 'Canon' }],
      ['non string model', { Model: 5, Make: 'Canon' }],
    ])('should throw MissingModelExifException for %s', async (_, exif) => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        photographerId: 'u1',
        exif,
      } as never);

      await expect(consumer.processCamera('p1')).rejects.toBeInstanceOf(
        MissingModelExifException,
      );
      expect(cameraRepository.upsert).not.toHaveBeenCalled();
    });

    it.each([
      ['missing make', { Model: 'EOS R5' }],
      ['non string make', { Model: 'EOS R5', Make: 1 }],
    ])('should throw MissingMakeExifException for %s', async (_, exif) => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        photographerId: 'u1',
        exif,
      } as never);

      await expect(consumer.processCamera('p1')).rejects.toBeInstanceOf(
        MissingMakeExifException,
      );
      expect(cameraRepository.upsert).not.toHaveBeenCalled();
    });
  });
});
