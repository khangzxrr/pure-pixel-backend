import { Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoGateway } from '../gateways/photo.gateway';
import { PhotoGenerateWatermarkService } from './photo-generate-watermark.service';
import { PhotoProcessService } from './photo-process.service';

jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  writeFileSync: jest.fn(),
}));

type Photo = Awaited<ReturnType<PhotoRepository['findUniqueOrThrow']>>;
type SharpInstance = Awaited<
  ReturnType<PhotoProcessService['sharpInitFromBuffer']>
>;

describe('PhotoGenerateWatermarkService', () => {
  let photoRepository: jest.Mocked<
    Pick<PhotoRepository, 'findUniqueOrThrow' | 'updateById'>
  >;
  let photoProcessService: jest.Mocked<
    Pick<
      PhotoProcessService,
      | 'sharpInitFromBuffer'
      | 'sharpInitFromFilePath'
      | 'sharpInitFromObjectKey'
      | 'makeWatermark'
      | 'uploadFromBuffer'
      | 'thumbnailFromBuffer'
    >
  >;
  let service: PhotoGenerateWatermarkService;

  const sourceSharp = {} as SharpInstance;
  const watermarkBuffer = Buffer.from('watermark');
  const thumbnailBuffer = Buffer.from('thumbnail');
  let watermark: { keepMetadata: jest.Mock; toBuffer: jest.Mock };

  const buildPhoto = (overrides: Partial<Photo> = {}): Photo =>
    ({
      id: 'p1',
      status: 'PARSED',
      originalPhotoUrl: 'u1/p1.jpg',
      watermarkPhotoUrl: '',
      ...overrides,
    }) as Photo;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    (writeFileSync as jest.Mock).mockReset();

    watermark = {
      keepMetadata: jest.fn(),
      toBuffer: jest.fn().mockResolvedValue(watermarkBuffer),
    };
    watermark.keepMetadata.mockReturnValue(watermark);

    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue(buildPhoto()),
      updateById: jest.fn().mockResolvedValue(buildPhoto()),
    };
    photoProcessService = {
      sharpInitFromBuffer: jest.fn().mockResolvedValue(sourceSharp),
      sharpInitFromFilePath: jest.fn().mockResolvedValue(sourceSharp),
      sharpInitFromObjectKey: jest.fn().mockResolvedValue(sourceSharp),
      makeWatermark: jest
        .fn()
        .mockResolvedValue(watermark as unknown as SharpInstance),
      uploadFromBuffer: jest.fn().mockResolvedValue(undefined),
      thumbnailFromBuffer: jest.fn().mockResolvedValue(thumbnailBuffer),
    };

    service = new PhotoGenerateWatermarkService(
      {} as PhotoGateway,
      photoRepository as unknown as PhotoRepository,
      photoProcessService as unknown as PhotoProcessService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateWatermarkFromBuffer', () => {
    it('creates watermark from buffer, uploads it and updates the photo', async () => {
      const buffer = Buffer.from('source');

      const result = await service.generateWatermarkFromBuffer(
        'p1',
        { text: 'HELLO' },
        buffer,
      );

      expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledWith(
        buffer,
      );
      expect(photoProcessService.makeWatermark).toHaveBeenCalledWith(
        sourceSharp,
        'HELLO',
      );
      expect(watermark.keepMetadata).toHaveBeenCalled();
      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'watermark/u1/p1.jpg',
        watermarkBuffer,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        watermarkPhotoUrl: 'watermark/u1/p1.jpg',
      });
      expect(result.watermarkPhotoUrl).toBe('watermark/u1/p1.jpg');
    });
  });

  describe('generateWatermark', () => {
    it('writes watermark to file system for pending photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({
          status: 'PENDING',
          originalPhotoUrl: '/tmp/purepixel-local-storage/abc.png',
        }),
      );

      await expect(
        service.generateWatermark('p1', { text: 'PXL' }),
      ).resolves.toBeUndefined();

      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        '/tmp/purepixel-local-storage/abc.png',
      );
      expect(photoProcessService.makeWatermark).toHaveBeenCalledWith(
        sourceSharp,
        'PXL',
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        '/tmp/purepixel-local-storage/p1_watermark.png',
        watermarkBuffer,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        watermarkPhotoUrl: '/tmp/purepixel-local-storage/p1_watermark.png',
      });
      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
    });

    it('uploads watermark and watermark thumbnail for parsed photos', async () => {
      await service.generateWatermark('p1', { text: 'PXL' });

      expect(photoProcessService.sharpInitFromObjectKey).toHaveBeenCalledWith(
        'u1/p1.jpg',
      );
      expect(photoProcessService.uploadFromBuffer).toHaveBeenNthCalledWith(
        1,
        'watermark/u1/p1.jpg',
        watermarkBuffer,
      );
      expect(photoProcessService.thumbnailFromBuffer).toHaveBeenCalledWith(
        watermarkBuffer,
      );
      expect(photoProcessService.uploadFromBuffer).toHaveBeenNthCalledWith(
        2,
        'thumbnail/watermark/p1.webp',
        thumbnailBuffer,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        watermarkPhotoUrl: 'watermark/u1/p1.jpg',
      });
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });
});
