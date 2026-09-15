import { rmSync } from 'fs';
import { Job, Queue } from 'bullmq';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { PhotoshootPackageConsumerService } from './photoshoot-package.consumer.service';
import { PhotoshootPackageConstant } from '../constants/photoshoot-package.constant';

jest.mock('uuid', () => ({ v4: () => 'uuid' }));
jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  rmSync: jest.fn(),
}));

const makeJob = (name: string, data: Record<string, unknown>): Job =>
  ({ name, data }) as unknown as Job;

describe('PhotoshootPackageConsumerService', () => {
  let consumer: PhotoshootPackageConsumerService;
  let photoshootRepository: {
    findUniqueOrThrow: jest.Mock;
    updateById: jest.Mock;
  };
  let photoProcessService: {
    sharpInitFromFilePath: jest.Mock;
    makeThumbnail: jest.Mock;
    uploadFromBuffer: jest.Mock;
  };
  let queue: { addBulk: jest.Mock };
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    photoshootRepository = {
      findUniqueOrThrow: jest.fn(),
      updateById: jest.fn().mockResolvedValue({}),
    };
    photoProcessService = {
      sharpInitFromFilePath: jest.fn((path: string) =>
        Promise.resolve(`sharp:${path}`),
      ),
      makeThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumb')),
      uploadFromBuffer: jest.fn().mockResolvedValue(undefined),
    };
    queue = { addBulk: jest.fn().mockResolvedValue([]) };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    consumer = new PhotoshootPackageConsumerService(
      photoshootRepository as unknown as PhotoshootRepository,
      photoProcessService as unknown as PhotoProcessService,
      queue as unknown as Queue,
    );
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('process', () => {
    it('dispatches UPLOAD_TO_CLOUD jobs to uploadToCloud', async () => {
      const spy = jest
        .spyOn(consumer, 'uploadToCloud')
        .mockResolvedValue(undefined);

      await consumer.process(
        makeJob(PhotoshootPackageConstant.UPLOAD_TO_CLOUD, {
          photoshootPackageId: 'package-id',
        }),
      );

      expect(spy).toHaveBeenCalledWith('package-id');
    });

    it('dispatches DELETE_TEMPORARY_PHOTO jobs to deleteFileSystemPhoto', async () => {
      await consumer.process(
        makeJob(PhotoshootPackageConstant.DELETE_TEMPORARY_PHOTO, {
          path: '/tmp/file.jpg',
        }),
      );

      expect(rmSync).toHaveBeenCalledWith('/tmp/file.jpg');
    });

    it('ignores unknown jobs', async () => {
      const spy = jest.spyOn(consumer, 'uploadToCloud');

      await expect(
        consumer.process(makeJob('UNKNOWN', {})),
      ).resolves.toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
      expect(rmSync).not.toHaveBeenCalled();
    });

    it('logs and rethrows a generic error when handler fails', async () => {
      const error = new Error('boom');
      jest.spyOn(consumer, 'uploadToCloud').mockRejectedValue(error);

      await expect(
        consumer.process(
          makeJob(PhotoshootPackageConstant.UPLOAD_TO_CLOUD, {
            photoshootPackageId: 'package-id',
          }),
        ),
      ).rejects.toThrow(Error);
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('uploadToCloud', () => {
    it('skips packages already on cloud', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'package-id',
        sourceStatus: 'CLOUD',
        thumbnail: 'key',
        showcases: [],
      });

      await consumer.uploadToCloud('package-id');

      expect(photoProcessService.sharpInitFromFilePath).not.toHaveBeenCalled();
      expect(photoshootRepository.updateById).not.toHaveBeenCalled();
      expect(queue.addBulk).not.toHaveBeenCalled();
    });

    it('uploads thumbnail and showcases, updates package and schedules cleanup', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'package-id',
        sourceStatus: 'FILESYSTEM',
        thumbnail: '/tmp/thumb.jpg',
        showcases: [{ photoUrl: '/tmp/s1.jpg' }, { photoUrl: '/tmp/s2.jpg' }],
      });

      await consumer.uploadToCloud('package-id');

      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        '/tmp/thumb.jpg',
      );
      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        '/tmp/s1.jpg',
      );
      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        '/tmp/s2.jpg',
      );
      expect(photoProcessService.makeThumbnail).toHaveBeenCalledTimes(3);
      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'photoshoot_thumbnail/uuid.webp',
        expect.any(Buffer),
      );
      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'photoshoot_showcase/uuid.webp',
        expect.any(Buffer),
      );
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        {
          thumbnail: 'photoshoot_thumbnail/uuid.webp',
          sourceStatus: 'CLOUD',
          showcases: {
            deleteMany: {},
            create: [
              { photoUrl: 'photoshoot_showcase/uuid.webp' },
              { photoUrl: 'photoshoot_showcase/uuid.webp' },
            ],
          },
        },
      );
      expect(queue.addBulk).toHaveBeenCalledWith(
        ['/tmp/thumb.jpg', '/tmp/s1.jpg', '/tmp/s2.jpg'].map((path) => ({
          name: PhotoshootPackageConstant.DELETE_TEMPORARY_PHOTO,
          data: { path },
          opts: { delay: 3000 },
        })),
      );
    });
  });

  describe('deleteFileSystemPhoto', () => {
    it('removes the file synchronously', () => {
      consumer.deleteFileSystemPhoto('/tmp/a.jpg');

      expect(rmSync).toHaveBeenCalledWith('/tmp/a.jpg');
    });
  });
});
