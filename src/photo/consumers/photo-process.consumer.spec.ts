import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { rm } from 'fs';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { TineyeService } from 'src/storage/services/tineye.service';
import { PhotoConstant } from '../constants/photo.constant';
import { TemporaryBookingPhotoUpload } from '../dtos/temporary-booking-photo-upload.dto';
import { TemporaryPhotoDto } from '../dtos/temporary-photo.dto';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoProcessConsumer } from './photo-process.consumer';

jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  rm: jest.fn(),
}));

const rmMock = rm as unknown as jest.Mock;

describe('PhotoProcessConsumer', () => {
  let photoRepository: Record<
    'findUniqueOrThrow' | 'updateById' | 'findFirst',
    jest.Mock
  >;
  let bookingRepository: Record<'findUniqueOrThrow', jest.Mock>;
  let photoProcessService: Record<
    | 'sharpInitFromFilePath'
    | 'sharpInitFromBuffer'
    | 'thumbnailFromBuffer'
    | 'makeThumbnail'
    | 'makeWatermark'
    | 'getBufferFromKey'
    | 'getHashFromBuffer'
    | 'bufferToBlurhash',
    jest.Mock
  >;
  let tineyeService: Record<'delete' | 'search' | 'add', jest.Mock>;
  let bunnyService: Record<'uploadFromBuffer' | 'getPresignedFile', jest.Mock>;
  let notificationService: Record<'addNotificationToQueue', jest.Mock>;
  let photoProcessQueue: Record<'addBulk', jest.Mock>;
  let consumer: PhotoProcessConsumer;

  const photo = {
    id: 'p1',
    title: 'Sunset',
    photographerId: 'u1',
    originalPhotoUrl: 'u1/p1.jpg',
    watermarkPhotoUrl: '/tmp/purepixel-local-storage/p1_watermark.jpg',
    photoType: 'RAW',
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    rmMock.mockReset();

    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue(photo),
      updateById: jest.fn().mockResolvedValue(photo),
      findFirst: jest.fn().mockResolvedValue(null),
    };
    bookingRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'b1' }),
    };
    photoProcessService = {
      sharpInitFromFilePath: jest.fn(),
      sharpInitFromBuffer: jest.fn().mockResolvedValue('sharp-from-buffer'),
      thumbnailFromBuffer: jest.fn().mockResolvedValue(Buffer.from('thumb')),
      makeThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumb')),
      makeWatermark: jest.fn(),
      getBufferFromKey: jest.fn().mockResolvedValue(Buffer.from('original')),
      getHashFromBuffer: jest.fn().mockResolvedValue('hash'),
      bufferToBlurhash: jest.fn().mockResolvedValue('blur'),
    };
    tineyeService = {
      delete: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue({ data: { result: [] } }),
      add: jest.fn().mockResolvedValue({ status: 200 }),
    };
    bunnyService = {
      uploadFromBuffer: jest.fn().mockResolvedValue(undefined),
      getPresignedFile: jest.fn().mockReturnValue('signed-url'),
    };
    notificationService = {
      addNotificationToQueue: jest.fn().mockResolvedValue({}),
    };
    photoProcessQueue = { addBulk: jest.fn().mockResolvedValue([]) };

    consumer = new PhotoProcessConsumer(
      photoRepository as unknown as PhotoRepository,
      bookingRepository as unknown as BookingRepository,
      photoProcessService as unknown as PhotoProcessService,
      tineyeService as unknown as TineyeService,
      bunnyService as unknown as BunnyService,
      notificationService as unknown as NotificationService,
      photoProcessQueue as unknown as Queue,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('process', () => {
    const job = (name: string, data: unknown) => ({ name, data }) as Job;

    it('dispatches UPLOAD_BOOKING_PHOTO_JOB_NAME', async () => {
      const spy = jest
        .spyOn(consumer, 'uploadBookingPhoto')
        .mockResolvedValue(undefined);
      const data = { bookingId: 'b1' };

      await consumer.process(
        job(PhotoConstant.UPLOAD_BOOKING_PHOTO_JOB_NAME, data),
      );

      expect(spy).toHaveBeenCalledWith(data);
    });

    it('dispatches UPLOAD_PHOTO_JOB_NAME', async () => {
      const spy = jest
        .spyOn(consumer, 'uploadToCloudStorage')
        .mockResolvedValue(undefined);
      const data = { photoId: 'p1' };

      await consumer.process(job(PhotoConstant.UPLOAD_PHOTO_JOB_NAME, data));

      expect(spy).toHaveBeenCalledWith(data);
    });

    it('dispatches PROCESS_PHOTO_JOB_NAME', async () => {
      const spy = jest
        .spyOn(consumer, 'processPhoto')
        .mockResolvedValue(undefined);

      await consumer.process(
        job(PhotoConstant.PROCESS_PHOTO_JOB_NAME, { id: 'p1' }),
      );

      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('dispatches DELETE_PHOTO_JOB_NAME', async () => {
      const spy = jest
        .spyOn(consumer, 'deleteTineyePhoto')
        .mockResolvedValue(undefined);

      await consumer.process(
        job(PhotoConstant.DELETE_PHOTO_JOB_NAME, { originalPhotoUrl: 'k' }),
      );

      expect(spy).toHaveBeenCalledWith('k');
    });

    it('dispatches BAN_PHOTO_JOB', async () => {
      const spy = jest.spyOn(consumer, 'banPhoto').mockResolvedValue(undefined);

      await consumer.process(job(PhotoConstant.BAN_PHOTO_JOB, { id: 'p1' }));

      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('dispatches UNBAN_PHOTO_JOB', async () => {
      const spy = jest.spyOn(consumer, 'unban').mockResolvedValue(undefined);

      await consumer.process(job(PhotoConstant.UNBAN_PHOTO_JOB, { id: 'p1' }));

      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('dispatches DELETE_TEMPORARY_PHOTO_JOB_NAME', async () => {
      const spy = jest
        .spyOn(consumer, 'deleteTemporaryPhoto')
        .mockImplementation(() => undefined);

      await consumer.process(
        job(PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME, '/tmp/a.jpg'),
      );

      expect(spy).toHaveBeenCalledWith('/tmp/a.jpg');
    });

    it('ignores unknown jobs', async () => {
      await expect(
        consumer.process(job('UNKNOWN', {})),
      ).resolves.toBeUndefined();
    });

    it('throws to retry when a handler fails', async () => {
      jest.spyOn(consumer, 'banPhoto').mockRejectedValue(new Error('db'));

      await expect(
        consumer.process(job(PhotoConstant.BAN_PHOTO_JOB, { id: 'p1' })),
      ).rejects.toThrow(Error);
    });
  });

  it('removes temporary photo from file system', () => {
    rmMock.mockImplementation((_path: string, callback: () => void) =>
      callback(),
    );

    consumer.deleteTemporaryPhoto('/tmp/a.jpg');

    expect(rmMock).toHaveBeenCalledWith('/tmp/a.jpg', expect.any(Function));
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'removed temporary photo /tmp/a.jpg',
    );
  });

  it('bans a photo and notifies the photographer', async () => {
    await consumer.banPhoto('p1');

    expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
      status: 'BAN',
    });
    expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        referenceType: 'PHOTO_BAN',
        payload: { id: 'p1' },
      }),
    );
  });

  it('unbans a photo and notifies the photographer', async () => {
    await consumer.unban('p1');

    expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
      status: 'PARSED',
    });
    expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        referenceType: 'PHOTO_UNBAN',
      }),
    );
  });

  describe('uploadBookingPhoto', () => {
    const temporaryPhoto = {
      bookingId: 'b1',
      photographerId: 'u1',
      photoId: 'p1',
      file: { path: '/tmp/purepixel-local-storage/raw.png' },
    } as unknown as TemporaryBookingPhotoUpload;

    it('skips when temporary file is empty', async () => {
      photoProcessService.sharpInitFromFilePath.mockResolvedValue({
        toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(0)),
      });

      await consumer.uploadBookingPhoto(temporaryPhoto);

      expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'b1',
      });
      expect(bunnyService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(photoRepository.updateById).not.toHaveBeenCalled();
    });

    it('uploads original, watermark and thumbnails then schedules cleanup', async () => {
      const original = Buffer.from('original');
      const watermark = Buffer.from('watermark');
      const thumb = Buffer.from('thumb');
      const watermarkThumb = Buffer.from('watermark-thumb');
      photoProcessService.sharpInitFromFilePath
        .mockResolvedValueOnce({
          toBuffer: jest.fn().mockResolvedValue(original),
        })
        .mockResolvedValueOnce({
          toBuffer: jest.fn().mockResolvedValue(watermark),
        });
      photoProcessService.thumbnailFromBuffer
        .mockResolvedValueOnce(thumb)
        .mockResolvedValueOnce(watermarkThumb);

      await consumer.uploadBookingPhoto(temporaryPhoto);

      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenNthCalledWith(
        2,
        photo.watermarkPhotoUrl,
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'u1/p1.png',
        original,
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'watermark/u1/p1.png',
        watermark,
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail/p1.webp',
        thumb,
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail/watermark/p1.webp',
        watermarkThumb,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        status: 'PARSED',
        originalPhotoUrl: 'u1/p1.png',
        watermarkPhotoUrl: 'watermark/u1/p1.png',
      });
      expect(photoProcessQueue.addBulk).toHaveBeenCalledWith([
        {
          name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
          data: '/tmp/purepixel-local-storage/raw.png',
          opts: { delay: 3000 },
        },
        {
          name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
          data: photo.watermarkPhotoUrl,
          opts: { delay: 3000 },
        },
      ]);
    });
  });

  describe('uploadToCloudStorage', () => {
    const temporaryPhoto = {
      photoId: 'p1',
      file: { path: '/tmp/purepixel-local-storage/raw.jpg' },
    } as unknown as TemporaryPhotoDto;

    const createRotatableSharp = (buffer: Buffer) => {
      const sharp = {
        rotate: jest.fn(),
        withMetadata: jest.fn(),
        toBuffer: jest.fn().mockResolvedValue(buffer),
      };
      sharp.rotate.mockReturnValue(sharp);
      sharp.withMetadata.mockReturnValue(sharp);
      return sharp;
    };

    it('skips when temporary file is empty', async () => {
      photoProcessService.sharpInitFromFilePath.mockResolvedValue(
        createRotatableSharp(Buffer.alloc(0)),
      );

      await consumer.uploadToCloudStorage(temporaryPhoto);

      expect(bunnyService.uploadFromBuffer).not.toHaveBeenCalled();
    });

    it('uploads rotated original, thumbnail and watermark then schedules cleanup', async () => {
      const original = Buffer.from('original');
      const sharp = createRotatableSharp(original);
      const removedMetaSharp = { id: 'second' };
      const watermarkBuffer = Buffer.from('watermark');
      const watermarkThumb = Buffer.from('watermark-thumb');
      photoProcessService.sharpInitFromFilePath
        .mockResolvedValueOnce(sharp)
        .mockResolvedValueOnce(removedMetaSharp);
      photoProcessService.makeWatermark.mockResolvedValue({
        toBuffer: jest.fn().mockResolvedValue(watermarkBuffer),
      });
      photoProcessService.thumbnailFromBuffer.mockResolvedValue(watermarkThumb);

      await consumer.uploadToCloudStorage(temporaryPhoto);

      expect(sharp.rotate).toHaveBeenCalled();
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'u1/p1.jpg',
        original,
      );
      expect(photoProcessService.makeThumbnail).toHaveBeenCalledWith(sharp);
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail/p1.webp',
        Buffer.from('thumb'),
      );
      expect(photoProcessService.makeWatermark).toHaveBeenCalledWith(
        removedMetaSharp,
        'PXL',
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'watermark/u1/p1.jpg',
        watermarkBuffer,
      );
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail/watermark/p1.webp',
        watermarkThumb,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        status: 'PARSED',
        originalPhotoUrl: 'u1/p1.jpg',
        watermarkPhotoUrl: 'watermark/u1/p1.jpg',
      });
      expect(photoProcessQueue.addBulk).toHaveBeenCalledWith([
        expect.objectContaining({
          data: '/tmp/purepixel-local-storage/raw.jpg',
        }),
        expect.objectContaining({
          data: '/tmp/purepixel-local-storage/p1_watermark.jpg',
        }),
      ]);
    });
  });

  it('deletes photo from tineye', async () => {
    await consumer.deleteTineyePhoto('u1/p1.jpg');

    expect(tineyeService.delete).toHaveBeenCalledWith('u1/p1.jpg');
  });

  it('generates and uploads thumbnail', async () => {
    const buffer = Buffer.from('x');

    await consumer.generateThumbnail('p1', buffer);

    expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledWith(
      buffer,
    );
    expect(photoProcessService.makeThumbnail).toHaveBeenCalledWith(
      'sharp-from-buffer',
    );
    expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
      'thumbnail/p1.webp',
      Buffer.from('thumb'),
    );
  });

  describe('processPhoto', () => {
    it('only generates thumbnail for booking photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        ...photo,
        photoType: 'BOOKING',
      });

      await consumer.processPhoto('p1');

      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail/p1.webp',
        Buffer.from('thumb'),
      );
      expect(photoProcessService.getHashFromBuffer).not.toHaveBeenCalled();
      expect(photoRepository.updateById).not.toHaveBeenCalled();
    });

    it('marks photo as duplicated when hash already exists', async () => {
      photoRepository.findFirst.mockResolvedValue({ id: 'other' });

      await consumer.processPhoto('p1');

      expect(photoRepository.findFirst).toHaveBeenCalledWith({ hash: 'hash' });
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        status: 'DUPLICATED',
        visibility: 'PRIVATE',
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: 'DUPLICATED_PHOTO' }),
      );
      expect(tineyeService.search).not.toHaveBeenCalled();
    });

    it('marks photo as duplicated when tineye match is at least 10 percent', async () => {
      tineyeService.search.mockResolvedValue({
        data: { result: [{ match_percent: 10 }] },
      });

      await consumer.processPhoto('p1');

      expect(bunnyService.getPresignedFile).toHaveBeenCalledWith(
        'u1/p1.jpg',
        `?width=${PhotoConstant.TINEYE_MIN_PHOTO_WIDTH}`,
      );
      expect(tineyeService.search).toHaveBeenCalledWith('signed-url');
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        status: 'DUPLICATED',
        visibility: 'PRIVATE',
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledTimes(
        1,
      );
      expect(tineyeService.add).not.toHaveBeenCalled();
    });

    it.each([
      ['low match', { data: { result: [{ match_percent: 9 }] } }],
      ['empty result', { data: { result: [] } }],
      ['missing result', { data: {} }],
    ])(
      'adds photo to tineye and saves hashes on %s',
      async (_name, response) => {
        tineyeService.search.mockResolvedValue(response);

        await consumer.processPhoto('p1');

        expect(tineyeService.add).toHaveBeenCalledWith(
          'u1/p1.jpg',
          'signed-url',
        );
        expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
          hash: 'hash',
          blurHash: 'blur',
        });
        expect(Logger.prototype.log).toHaveBeenCalledWith(
          'uploaded photo u1/p1.jpg to tineye',
        );
      },
    );

    it('continues when tineye search and add fail', async () => {
      tineyeService.search.mockRejectedValue(new Error('search'));
      tineyeService.add.mockRejectedValue(new Error('add'));

      await consumer.processPhoto('p1');

      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        hash: 'hash',
        blurHash: 'blur',
      });
    });

    it('does not log upload when tineye add is not ok', async () => {
      tineyeService.add.mockResolvedValue({ status: 500 });

      await consumer.processPhoto('p1');

      expect(Logger.prototype.log).not.toHaveBeenCalledWith(
        'uploaded photo u1/p1.jpg to tineye',
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        hash: 'hash',
        blurHash: 'blur',
      });
    });
  });
});
