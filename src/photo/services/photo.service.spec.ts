import { HttpException, Logger } from '@nestjs/common';
import { Photo, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { MemoryStoredFile, FileSystemStoredFile } from 'nestjs-form-data';
import { CameraConstant } from 'src/camera/constants/camera.constant';
import { CategoryRepository } from 'src/database/repositories/category.repository';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotoDetail } from 'src/database/types/photo';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PrismaService } from 'src/prisma.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { UserService } from 'src/user/services/user.service';
import { PhotoConstant } from '../constants/photo.constant';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { FindNextPhotoFilterDto } from '../dtos/find-next.filter.dto';
import { PhotoSizeDto } from '../dtos/photo-size.dto';
import { SharePhotoResponseDto } from '../dtos/rest/share-photo-response.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { CannotUpdateVisibilityPhotoHasActiveSellingException } from '../exceptions/cannot-update-visibility-photo-has-active-selling.exception';
import { CannotUpdateWatermarkPhotoHasActiveSellingException } from '../exceptions/cannot-update-watermark-photo-has-active-selling.exception';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { ChoosedShareQualityIsNotFoundException } from '../exceptions/choosed-share-quality-is-not-found.exception';
import { DuplicatedTagFoundException } from '../exceptions/duplicated-tag-found.exception';
import { EmptyOriginalPhotoException } from '../exceptions/empty-original-photo.exception';
import { ExifNotFoundException } from '../exceptions/exif-not-found.exception';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { MissingMakeExifException } from '../exceptions/missing-make-exif.exception';
import { MissingModelExifException } from '../exceptions/missing-model-exif.exception';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
import { PhotoBannedException } from '../exceptions/photo-banned.exception';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';
import { UploadPhotoFailedException } from '../exceptions/upload-photo-failed.exception';
import { PhotoGenerateWatermarkService } from './photo-generate-watermark.service';
import { PhotoProcessService } from './photo-process.service';
import { PhotoValidateService } from './photo-validate.service';
import { PhotoService } from './photo.service';

type PhotoFixture = Record<string, unknown> & {
  id: string;
  photographerId: string;
};

describe('PhotoService', () => {
  let photoRepository: Record<
    | 'findUniqueOrThrow'
    | 'updateByIdQuery'
    | 'count'
    | 'findAll'
    | 'findAllPhotosWithVoteAndCommentCountByUserId'
    | 'countByGPS'
    | 'findAllIdsByGPS'
    | 'deleteById'
    | 'create'
    | 'findAllHash',
    jest.Mock
  >;
  let userRepository: Record<'findUniqueOrThrow' | 'update', jest.Mock>;
  let photoProcessService: Record<
    | 'sharpInitFromFilePath'
    | 'sharpInitFromObjectKey'
    | 'resizeWithMetadata'
    | 'signPendingPhoto'
    | 'signPendingWatermarkPhoto'
    | 'signPhoto'
    | 'signWatermarkPhoto'
    | 'parseMetadataFromBuffer'
    | 'bufferToBlurhash'
    | 'parseExifFromFilePath'
    | 'parseMetadataFromFilePath'
    | 'getHashFromBuffer'
    | 'isExistHash'
    | 'parseExifFromBuffer',
    jest.Mock
  >;
  let photoTagRepository: Record<'deleteByPhotoId' | 'create', jest.Mock>;
  let categoryRepository: Record<'findMany', jest.Mock>;
  let bunnyService: Record<'getPresignedFile' | 'upload', jest.Mock>;
  let photoValidateService: Record<'validateHashAndMatching', jest.Mock>;
  let photoGenerateWatermarkService: Record<'generateWatermark', jest.Mock>;
  let photoProcessQueue: Record<'add', jest.Mock>;
  let cameraQueue: Record<'add', jest.Mock>;
  let transaction: jest.Mock;
  let userService: Record<'updatePhotoQuota', jest.Mock>;
  let service: PhotoService;

  const originalBackendOrigin = process.env.BACKEND_ORIGIN;

  const buildPhoto = (
    overrides: Record<string, unknown> = {},
  ): PhotoFixture => ({
    id: 'p1',
    photographerId: 'u1',
    cameraId: null,
    bookingId: null,
    title: 'Sunset',
    normalizedTitle: 'sunset',
    width: 1000,
    height: 800,
    viewCount: 0,
    watermark: false,
    exif: { Make: 'Canon' },
    description: '',
    originalPhotoUrl: 'u1/p1.jpg',
    watermarkPhotoUrl: 'watermark/u1/p1.jpg',
    photoType: 'RAW',
    visibility: 'PUBLIC',
    status: 'PARSED',
    size: 100,
    hash: '',
    blurHash: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    photoSellings: [],
    ...overrides,
  });

  const asPhoto = (photo: PhotoFixture) => photo as unknown as Photo;
  const asDetail = (photo: PhotoFixture) => photo as unknown as PhotoDetail;

  const pendingUrl = { url: 'pending', thumbnail: 'pending' };
  const pendingWatermarkUrl = {
    url: 'pending-watermark',
    thumbnail: 'pending-watermark',
  };
  const signedUrl = { url: 'signed', thumbnail: 'signed' };
  const signedWatermarkUrl = {
    url: 'signed-watermark',
    thumbnail: 'signed-watermark',
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.env.BACKEND_ORIGIN = 'https://api.test';

    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue(buildPhoto()),
      updateByIdQuery: jest.fn().mockReturnValue('update-query'),
      count: jest.fn().mockResolvedValue(7),
      findAll: jest.fn().mockResolvedValue([buildPhoto()]),
      findAllPhotosWithVoteAndCommentCountByUserId: jest
        .fn()
        .mockResolvedValue(['with-count']),
      countByGPS: jest.fn().mockResolvedValue([{ count: BigInt(3) }]),
      findAllIdsByGPS: jest.fn().mockResolvedValue([]),
      deleteById: jest.fn().mockResolvedValue({}),
      create: jest.fn(async (data: Record<string, unknown>) =>
        buildPhoto({
          id: 'new',
          size: data.size,
          status: data.status,
          originalPhotoUrl: data.originalPhotoUrl,
          watermarkPhotoUrl: data.watermarkPhotoUrl,
        }),
      ),
      findAllHash: jest.fn().mockResolvedValue([{ id: 'x', hash: 'h1' }]),
    };
    userRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'u1',
        name: 'Khang',
        photoQuotaUsage: BigInt(0),
        maxPhotoQuota: BigInt(1000),
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    photoProcessService = {
      sharpInitFromFilePath: jest.fn(),
      sharpInitFromObjectKey: jest.fn(),
      resizeWithMetadata: jest.fn().mockResolvedValue(Buffer.from('resized')),
      signPendingPhoto: jest.fn().mockReturnValue(pendingUrl),
      signPendingWatermarkPhoto: jest.fn().mockReturnValue(pendingWatermarkUrl),
      signPhoto: jest.fn().mockReturnValue(signedUrl),
      signWatermarkPhoto: jest.fn().mockReturnValue(signedWatermarkUrl),
      parseMetadataFromBuffer: jest
        .fn()
        .mockResolvedValue({ width: 1000, height: 800 }),
      bufferToBlurhash: jest.fn().mockResolvedValue('blur'),
      parseExifFromFilePath: jest
        .fn()
        .mockResolvedValue({ Make: 'Canon ', Model: 'R5' }),
      parseMetadataFromFilePath: jest
        .fn()
        .mockResolvedValue({ width: 1000, height: 800 }),
      getHashFromBuffer: jest.fn().mockResolvedValue('hash'),
      isExistHash: jest.fn().mockReturnValue(false),
      parseExifFromBuffer: jest
        .fn()
        .mockResolvedValue({ Make: 'Canon', Model: 'R5' }),
    };
    photoTagRepository = {
      deleteByPhotoId: jest.fn().mockReturnValue('delete-tags'),
      create: jest.fn((id: string, tag: string) => `create-${tag}`),
    };
    categoryRepository = {
      findMany: jest.fn().mockResolvedValue([{ id: 'c1' }]),
    };
    bunnyService = {
      getPresignedFile: jest.fn(
        (key: string, query = '') => `signed:${key}${query}`,
      ),
      upload: jest.fn().mockResolvedValue('u1/uploaded.jpg'),
    };
    photoValidateService = {
      validateHashAndMatching: jest.fn().mockResolvedValue(undefined),
    };
    photoGenerateWatermarkService = {
      generateWatermark: jest.fn().mockResolvedValue(undefined),
    };
    photoProcessQueue = { add: jest.fn().mockResolvedValue({}) };
    cameraQueue = { add: jest.fn().mockResolvedValue({}) };
    transaction = jest.fn(async (queries: unknown[]) => [
      ...queries.slice(0, -1),
      buildPhoto({ title: 'updated' }),
    ]);
    userService = { updatePhotoQuota: jest.fn().mockResolvedValue(undefined) };

    service = new PhotoService(
      photoRepository as unknown as PhotoRepository,
      userRepository as unknown as UserRepository,
      photoProcessService as unknown as PhotoProcessService,
      photoTagRepository as unknown as PhotoTagRepository,
      categoryRepository as unknown as CategoryRepository,
      bunnyService as unknown as BunnyService,
      photoValidateService as unknown as PhotoValidateService,
      photoGenerateWatermarkService as unknown as PhotoGenerateWatermarkService,
      photoProcessQueue as unknown as Queue,
      cameraQueue as unknown as Queue,
      {
        extendedClient: jest
          .fn()
          .mockReturnValue({ $transaction: transaction }),
      } as unknown as PrismaService,
      userService as unknown as UserService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.BACKEND_ORIGIN = originalBackendOrigin;
  });

  describe('downloadTemporaryPhoto', () => {
    const createSharp = () => {
      const sharp = {
        withMetadata: jest.fn(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('full')),
      };
      sharp.withMetadata.mockReturnValue(sharp);
      return sharp;
    };

    it.each([
      [true, 'watermark/u1/p1.jpg'],
      [false, 'u1/p1.jpg'],
    ])(
      'reads pending photo from file system (watermark=%p)',
      async (watermark, expectedPath) => {
        photoRepository.findUniqueOrThrow.mockResolvedValue(
          buildPhoto({ status: 'PENDING', watermark }),
        );
        const sharp = createSharp();
        photoProcessService.sharpInitFromFilePath.mockResolvedValue(sharp);

        await expect(service.downloadTemporaryPhoto('p1', {})).resolves.toEqual(
          Buffer.from('full'),
        );
        expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
          expectedPath,
        );
        expect(sharp.withMetadata).toHaveBeenCalled();
      },
    );

    it.each([
      [true, 'watermark/u1/p1.jpg'],
      [false, 'u1/p1.jpg'],
    ])(
      'reads parsed photo from cloud and resizes (watermark=%p)',
      async (watermark, expectedKey) => {
        photoRepository.findUniqueOrThrow.mockResolvedValue(
          buildPhoto({ watermark }),
        );
        const sharp = createSharp();
        photoProcessService.sharpInitFromObjectKey.mockResolvedValue(sharp);

        await expect(
          service.downloadTemporaryPhoto('p1', { width: 480 }),
        ).resolves.toEqual(Buffer.from('resized'));
        expect(photoProcessService.sharpInitFromObjectKey).toHaveBeenCalledWith(
          expectedKey,
        );
        expect(photoProcessService.resizeWithMetadata).toHaveBeenCalledWith(
          sharp,
          480,
        );
      },
    );
  });

  describe('findAndValidatePhotoIsNotFoundAndBelongToPhotographer', () => {
    it('throws when photo belongs to another photographer', async () => {
      await expect(
        service.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
          'other',
          'p1',
        ),
      ).rejects.toBeInstanceOf(NotBelongPhotoException);
    });

    it('returns photo of the photographer', async () => {
      await expect(
        service.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
          'u1',
          'p1',
        ),
      ).resolves.toEqual(buildPhoto());
    });
  });

  describe('sendImageWatermarkQueue', () => {
    it('throws for duplicated photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'DUPLICATED' }),
      );

      await expect(
        service.sendImageWatermarkQueue('u1', 'p1', { text: 'PXL' }),
      ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
      expect(
        photoGenerateWatermarkService.generateWatermark,
      ).not.toHaveBeenCalled();
    });

    it('generates watermark and returns signed updated photo', async () => {
      const result = await service.sendImageWatermarkQueue('u1', 'p1', {
        text: 'PXL',
      });

      expect(
        photoGenerateWatermarkService.generateWatermark,
      ).toHaveBeenCalledWith('p1', { text: 'PXL' });
      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledTimes(2);
      expect(result).toBeInstanceOf(SignedPhotoDto);
      expect(result.signedUrl).toEqual(signedUrl);
    });
  });

  describe('sharePhoto', () => {
    const shareRequest = {
      photoId: 'p1',
      size: new PhotoSizeDto(1000, 800),
    };

    it('throws for duplicated photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'DUPLICATED' }),
      );

      await expect(
        service.sharePhoto('u1', shareRequest),
      ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
    });

    it.each([new PhotoSizeDto(900, 800), new PhotoSizeDto(1000, 700)])(
      'throws when share size %p is not available',
      async (size) => {
        await expect(
          service.sharePhoto('u1', { photoId: 'p1', size }),
        ).rejects.toBeInstanceOf(ChoosedShareQualityIsNotFoundException);
      },
    );

    it('returns cloud share url for parsed photos', async () => {
      const result = await service.sharePhoto('u1', shareRequest);

      expect(result).toBeInstanceOf(SharePhotoResponseDto);
      expect(result).toEqual(
        new SharePhotoResponseDto(
          shareRequest.size,
          'signed:u1/p1.jpg?width=1000',
        ),
      );
    });

    it('returns temporary share url for pending photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'PENDING' }),
      );

      const result = await service.sharePhoto('u1', shareRequest);

      expect(result.shareUrl).toBe(
        'https://api.test/photo/p1/temporary-photo?width=1000',
      );
    });
  });

  describe('getAvailablePhotoResolution', () => {
    it('returns scaled temporary resolutions for pending photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'PENDING' }),
      );

      const result = await service.getAvailablePhotoResolution('p1');

      expect(result).toEqual([
        new PhotoSizeDto(
          1000,
          800,
          'https://api.test/photo/p1/temporary-photo?width=1000',
        ),
        new PhotoSizeDto(
          800,
          640,
          'https://api.test/photo/p1/temporary-photo?width=800',
        ),
        new PhotoSizeDto(
          640,
          512,
          'https://api.test/photo/p1/temporary-photo?width=640',
        ),
        new PhotoSizeDto(
          512,
          410,
          'https://api.test/photo/p1/temporary-photo?width=512',
        ),
      ]);
    });

    it.each([
      [true, 'watermark/u1/p1.jpg'],
      [false, 'u1/p1.jpg'],
    ])(
      'returns signed preview resolutions for parsed photos (watermark=%p)',
      async (watermark, key) => {
        photoRepository.findUniqueOrThrow.mockResolvedValue(
          buildPhoto({ watermark }),
        );

        const result = await service.getAvailablePhotoResolution('p1');

        expect(result.map((r) => [r.width, r.height])).toEqual([
          [1000, 800],
          [800, 640],
          [640, 512],
          [512, 410],
        ]);
        expect(result[0].preview).toBe(`signed:${key}?width=1000`);
      },
    );

    it('returns empty list when photo is smaller than minimum width', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ width: PhotoConstant.MIN_PHOTO_WIDTH - 1 }),
      );

      await expect(service.getAvailablePhotoResolution('p1')).resolves.toEqual(
        [],
      );
    });
  });

  it('signs multiple photos', async () => {
    const result = await service.signPhotos([
      asPhoto(buildPhoto()),
      asPhoto(buildPhoto({ id: 'p2', watermark: true })),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].signedUrl).toEqual(signedUrl);
    expect(result[1].signedUrl).toEqual(signedWatermarkUrl);
  });

  describe('signPhotoDetail', () => {
    it('generates missing watermark before signing', async () => {
      const spy = jest
        .spyOn(service, 'sendImageWatermarkQueue')
        .mockResolvedValue(
          Object.assign(new SignedPhotoDto(), {
            watermarkPhotoUrl: 'watermark/new.jpg',
          }),
        );

      const result = await service.signPhotoDetail(
        asDetail(buildPhoto({ watermark: true, watermarkPhotoUrl: '' })),
      );

      expect(spy).toHaveBeenCalledWith('u1', 'p1', { text: 'PXL' });
      expect(result.watermarkPhotoUrl).toBe('watermark/new.jpg');
    });

    it.each([
      ['PENDING', true, 'signPendingWatermarkPhoto', pendingWatermarkUrl],
      ['PENDING', false, 'signPendingPhoto', pendingUrl],
      ['PARSED', true, 'signWatermarkPhoto', signedWatermarkUrl],
      ['PARSED', false, 'signPhoto', signedUrl],
    ] as const)(
      'signs %s photo with watermark=%p using %s',
      async (status, watermark, method, expected) => {
        const result = await service.signPhotoDetail(
          asDetail(buildPhoto({ status, watermark, photoSellings: undefined })),
        );

        expect(photoProcessService[method]).toHaveBeenCalled();
        expect(result).toBeInstanceOf(SignedPhotoDto);
        expect(result.signedUrl).toEqual(expected);
      },
    );

    it('sets temporary pricetag previews for pending photos', async () => {
      const result = await service.signPhotoDetail(
        asDetail(
          buildPhoto({
            status: 'PENDING',
            photoSellings: [
              { active: true, pricetags: [{ width: 800, height: 640 }] },
            ],
          }),
        ),
      );

      expect(result.photoSellings[0].pricetags[0].preview).toBe(
        'https://api.test/photo/p1/temporary-photo?width=800',
      );
    });

    it('sets signed watermark pricetag previews for parsed photos', async () => {
      const result = await service.signPhotoDetail(
        asDetail(
          buildPhoto({
            photoSellings: [
              { active: true, pricetags: [{ width: 640, height: 512 }] },
            ],
          }),
        ),
      );

      expect(result.photoSellings[0].pricetags[0].preview).toBe(
        'signed:watermark/u1/p1.jpg?width=640',
      );
    });
  });

  describe('signWatermarkPhotos', () => {
    it('generates missing watermark and signs pending photo', async () => {
      const spy = jest
        .spyOn(service, 'sendImageWatermarkQueue')
        .mockResolvedValue(new SignedPhotoDto());

      const result = await service.signWatermarkPhotos(
        asPhoto(buildPhoto({ status: 'PENDING', watermarkPhotoUrl: '' })),
      );

      expect(spy).toHaveBeenCalledWith('u1', 'p1', { text: 'PXL' });
      expect(result.signedUrl).toEqual(pendingWatermarkUrl);
    });

    it('forces watermark signing for parsed photo', async () => {
      const photo = asPhoto(buildPhoto({ watermark: false }));

      const result = await service.signWatermarkPhotos(photo);

      expect(photoProcessService.signWatermarkPhoto).toHaveBeenCalledWith(
        'watermark/u1/p1.jpg',
        'p1',
      );
      expect(result.signedUrl).toEqual(signedWatermarkUrl);
    });
  });

  describe('signPhoto', () => {
    it('generates watermark when watermark url is missing', async () => {
      const spy = jest
        .spyOn(service, 'sendImageWatermarkQueue')
        .mockResolvedValue(new SignedPhotoDto());

      await service.signPhoto(
        asPhoto(buildPhoto({ watermark: true, watermarkPhotoUrl: '' })),
      );

      expect(spy).toHaveBeenCalledWith('u1', 'p1', { text: 'PXL' });
    });

    it('throws when original url is missing', async () => {
      await expect(
        service.signPhoto(asPhoto(buildPhoto({ originalPhotoUrl: '' }))),
      ).rejects.toBeInstanceOf(EmptyOriginalPhotoException);
    });

    it.each([
      ['PENDING', true, pendingWatermarkUrl],
      ['PENDING', false, pendingUrl],
      ['PARSED', true, signedWatermarkUrl],
      ['PARSED', false, signedUrl],
    ] as const)(
      'signs %s photo with watermark=%p',
      async (status, watermark, expected) => {
        const result = await service.signPhoto(
          asPhoto(buildPhoto({ status, watermark })),
        );

        expect(result).toBeInstanceOf(SignedPhotoDto);
        expect(result.signedUrl).toEqual(expected);
      },
    );
  });

  describe('updatePhoto', () => {
    it('throws for duplicated photos', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'DUPLICATED' }),
      );

      await expect(service.updatePhoto('u1', 'p1', {})).rejects.toBeInstanceOf(
        FailToPerformOnDuplicatedPhotoException,
      );
    });

    it('throws when photo belongs to another photographer', async () => {
      await expect(
        service.updatePhoto('other', 'p1', {}),
      ).rejects.toBeInstanceOf(NotBelongPhotoException);
    });

    it('throws when some categories are not found', async () => {
      await expect(
        service.updatePhoto('u1', 'p1', { categoryIds: ['c1', 'c2'] }),
      ).rejects.toBeInstanceOf(CategoryNotFoundException);
    });

    it.each([null, ['array'], 'text'])(
      'throws when updating gps without valid exif (%p)',
      async (exif) => {
        photoRepository.findUniqueOrThrow.mockResolvedValue(
          buildPhoto({ exif }),
        );

        await expect(
          service.updatePhoto('u1', 'p1', {
            gps: { latitude: 1, longitude: 2 },
          }),
        ).rejects.toBeInstanceOf(ExifNotFoundException);
      },
    );

    it('throws when photo tags are duplicated', async () => {
      await expect(
        service.updatePhoto('u1', 'p1', { photoTags: ['a', 'a'] }),
      ).rejects.toBeInstanceOf(DuplicatedTagFoundException);
    });

    it('throws when enabling watermark on photo with active selling', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ photoSellings: [{ active: true }] }),
      );

      await expect(
        service.updatePhoto('u1', 'p1', { watermark: true }),
      ).rejects.toBeInstanceOf(
        CannotUpdateWatermarkPhotoHasActiveSellingException,
      );
    });

    it('throws when changing visibility on photo with active selling', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ photoSellings: [{ active: false }, { active: true }] }),
      );

      await expect(
        service.updatePhoto('u1', 'p1', { visibility: 'PRIVATE' }),
      ).rejects.toBeInstanceOf(
        CannotUpdateVisibilityPhotoHasActiveSellingException,
      );
    });

    it('updates all fields in one transaction', async () => {
      const result = await service.updatePhoto('u1', 'p1', {
        categoryIds: ['c1'],
        watermark: true,
        gps: { latitude: 10, longitude: 106 },
        photoTags: ['a', 'b'],
        title: 'New Title',
        description: 'desc',
        photoType: 'RAW',
        visibility: 'PUBLIC',
      });

      expect(categoryRepository.findMany).toHaveBeenCalledWith({
        id: { in: ['c1'] },
      });
      expect(
        photoGenerateWatermarkService.generateWatermark,
      ).toHaveBeenCalledWith('p1', { text: 'PXL' });
      expect(photoRepository.updateByIdQuery).toHaveBeenCalledWith('p1', {
        categories: { set: [{ id: 'c1' }] },
        title: 'New Title',
        normalizedTitle: 'new title',
        watermark: true,
        description: 'desc',
        photoType: 'RAW',
        visibility: 'PUBLIC',
        exif: { Make: 'Canon', latitude: 10, longitude: 106 },
      });
      expect(transaction).toHaveBeenCalledWith([
        'delete-tags',
        'create-a',
        'create-b',
        'update-query',
      ]);
      expect(result).toBeInstanceOf(SignedPhotoDto);
      expect(result.title).toBe('updated');
    });

    it('uses defaults when optional fields are absent', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ exif: null }),
      );

      await service.updatePhoto('u1', 'p1', { watermark: false });

      expect(categoryRepository.findMany).not.toHaveBeenCalled();
      expect(
        photoGenerateWatermarkService.generateWatermark,
      ).not.toHaveBeenCalled();
      expect(photoRepository.updateByIdQuery).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          categories: { set: [] },
          normalizedTitle: 'sunset',
          exif: Prisma.JsonNull,
        }),
      );
      expect(transaction).toHaveBeenCalledWith(['update-query']);
    });
  });

  describe('findNextPublicPhotos', () => {
    it.each([
      [true, 1],
      [false, -1],
    ])('finds next public photo with forward=%p', async (forward, take) => {
      const filter = Object.assign(new FindNextPhotoFilterDto(), {
        cursor: 'p0',
        forward,
      });

      const result = await service.findNextPublicPhotos('u1', filter);

      expect(photoRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'PUBLIC', photoType: 'RAW' }),
        [],
        1,
        take,
        { id: 'p0' },
      );
      expect(result).toBeInstanceOf(PagingPaginatedResposneDto);
      expect(result.totalRecord).toBe(7);
      expect(result.totalPage).toBe(7);
      expect(result.objects).toHaveLength(1);
    });
  });

  it('forces public raw filters when finding public photos', async () => {
    const spy = jest
      .spyOn(service, 'findAll')
      .mockResolvedValue(new PagingPaginatedResposneDto(10, 0, []));
    const filter = Object.assign(new FindAllPhotoFilterDto(), {
      limit: 10,
      page: 0,
      photoType: 'BOOKING',
    });

    await service.findPublicPhotos('u1', filter);

    expect(filter.photoType).toBe('RAW');
    expect(filter.visibility).toBe('PUBLIC');
    expect(filter.statuses).toEqual(['PENDING', 'PARSED']);
    expect(spy).toHaveBeenCalledWith('u1', filter);
  });

  it('finds all photos with vote and comment count', async () => {
    await expect(
      service.findAllWithUpvoteAndCommentCountByUserId('u1'),
    ).resolves.toEqual(['with-count']);
    expect(
      photoRepository.findAllPhotosWithVoteAndCommentCountByUserId,
    ).toHaveBeenCalledWith('u1');
  });

  describe('findAll', () => {
    it('finds photos by filter without gps', async () => {
      const filter = Object.assign(new FindAllPhotoFilterDto(), {
        limit: 5,
        page: 2,
        orderByUpvote: 'desc',
      });

      const result = await service.findAll('u1', filter);

      expect(photoRepository.countByGPS).not.toHaveBeenCalled();
      expect(filter.ids).toBeUndefined();
      expect(photoRepository.count).toHaveBeenCalledWith({});
      expect(photoRepository.findAll).toHaveBeenCalledWith(
        {},
        [{ votes: { _count: 'desc' } }],
        10,
        5,
      );
      expect(result.totalRecord).toBe(7);
      expect(result.totalPage).toBe(2);
      expect(result.objects[0]).toBeInstanceOf(SignedPhotoDto);
    });

    it('filters and sorts photos by gps distance', async () => {
      photoRepository.findAllIdsByGPS.mockResolvedValue([
        { id: 'p2' },
        { id: 'missing' },
        { id: 'p1' },
      ]);
      photoRepository.findAll.mockResolvedValue([
        buildPhoto({ id: 'p1' }),
        buildPhoto({ id: 'p2' }),
      ]);
      const filter = Object.assign(new FindAllPhotoFilterDto(), {
        limit: 10,
        page: 0,
        gps: true,
        latitude: 10.5,
        longitude: 106.7,
        distance: 5,
      });

      const result = await service.findAll('u1', filter);

      expect(photoRepository.countByGPS).toHaveBeenCalledWith(106.7, 10.5, 5);
      expect(photoRepository.findAllIdsByGPS).toHaveBeenCalledWith(
        106.7,
        10.5,
        5,
      );
      expect(filter.ids).toEqual(['p2', 'missing', 'p1']);
      expect(photoRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({ id: { in: ['p2', 'missing', 'p1'] } }),
      );
      expect(result.objects.map((p) => p.id)).toEqual(['p2', 'p1']);
    });

    it('does not filter ids when gps search returns nothing', async () => {
      const filter = Object.assign(new FindAllPhotoFilterDto(), {
        limit: 10,
        page: 0,
        gps: true,
        latitude: 10.5,
        longitude: 106.7,
        distance: 5,
      });

      const result = await service.findAll('u1', filter);

      expect(photoRepository.findAllIdsByGPS).toHaveBeenCalled();
      expect(filter.ids).toBeUndefined();
      expect(result.objects).toHaveLength(1);
    });

    it('skips gps search when coordinates are incomplete', async () => {
      const filter = Object.assign(new FindAllPhotoFilterDto(), {
        limit: 10,
        page: 0,
        gps: true,
        latitude: 10.5,
      });

      await service.findAll('u1', filter);

      expect(photoRepository.countByGPS).not.toHaveBeenCalled();
    });
  });

  it('deletes photo, queues tineye deletion and restores quota', async () => {
    await expect(service.deleteById('u1', 'p1')).resolves.toBe(true);

    expect(photoProcessQueue.add).toHaveBeenCalledWith(
      PhotoConstant.DELETE_PHOTO_JOB_NAME,
      { originalPhotoUrl: 'u1/p1.jpg' },
    );
    expect(photoRepository.deleteById).toHaveBeenCalledWith('p1');
    expect(userService.updatePhotoQuota).toHaveBeenCalledWith('u1', 100);
  });

  describe('findById', () => {
    it('throws when photo is not found', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(null);

      await expect(service.findById('u1', 'p1')).rejects.toBeInstanceOf(
        PhotoNotFoundException,
      );
    });

    it('throws when private photo is viewed by another user', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ visibility: 'PRIVATE' }),
      );

      await expect(service.findById('other', 'p1')).rejects.toBeInstanceOf(
        PhotoIsPrivatedException,
      );
      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith(
        'p1',
        'other',
      );
    });

    it('throws when banned photo is viewed by another user', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'BAN' }),
      );

      await expect(service.findById('other', 'p1')).rejects.toBeInstanceOf(
        PhotoBannedException,
      );
    });

    it('returns private banned photo to its owner', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ visibility: 'PRIVATE', status: 'BAN' }),
      );

      await expect(service.findById('u1', 'p1')).resolves.toBeInstanceOf(
        SignedPhotoDto,
      );
    });

    it('skips ownership validation when disabled', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ visibility: 'PRIVATE', status: 'BAN' }),
      );

      await expect(
        service.findById('other', 'p1', false),
      ).resolves.toBeInstanceOf(SignedPhotoDto);
    });

    it('returns public photo to another user', async () => {
      await expect(service.findById('other', 'p1')).resolves.toBeInstanceOf(
        SignedPhotoDto,
      );
    });
  });

  const memoryFile = (overrides: Record<string, unknown> = {}) =>
    ({
      size: 100,
      extension: 'jpg',
      originalName: 'Ảnh Đẹp.jpg',
      buffer: Buffer.from('image'),
      ...overrides,
    }) as unknown as MemoryStoredFile;

  describe('uploadBookingPhoto', () => {
    it('throws when photo quota is exceeded', async () => {
      await expect(
        service.uploadBookingPhoto('u1', { file: memoryFile({ size: 1000 }) }),
      ).rejects.toBeInstanceOf(RunOutPhotoQuotaException);
    });

    it('throws when extension is not supported', async () => {
      await expect(
        service.uploadBookingPhoto('u1', {
          file: memoryFile({ extension: 'gif' }),
        }),
      ).rejects.toBeInstanceOf(FileIsNotValidException);
      expect(bunnyService.upload).not.toHaveBeenCalled();
    });

    it('uploads booking photo and queues processing', async () => {
      const file = memoryFile({ extension: 'png' });

      const result = await service.uploadBookingPhoto('u1', { file });

      expect(bunnyService.upload).toHaveBeenCalledWith(file);
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          photographer: { connect: { id: 'u1' } },
          title: 'Ảnh Đẹp.jpg',
          normalizedTitle: 'anh dep.jpg',
          width: 1000,
          height: 800,
          status: 'PARSED',
          photoType: 'BOOKING',
          blurHash: 'blur',
          visibility: 'PRIVATE',
          originalPhotoUrl: 'u1/uploaded.jpg',
        }),
      );
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        photoQuotaUsage: { increment: 100 },
      });
      expect(photoProcessQueue.add).toHaveBeenCalledWith(
        PhotoConstant.PROCESS_PHOTO_JOB_NAME,
        { id: 'new' },
      );
      expect(result.signedUrl).toEqual(signedUrl);
    });

    it.each([[{ height: 800 }], [{ width: 1000 }]])(
      'rethrows http exception when metadata is %p',
      async (metadata) => {
        photoProcessService.parseMetadataFromBuffer.mockResolvedValue(metadata);

        await expect(
          service.uploadBookingPhoto('u1', { file: memoryFile() }),
        ).rejects.toBeInstanceOf(FileIsNotValidException);
        expect(photoRepository.create).not.toHaveBeenCalled();
      },
    );

    it('wraps unknown errors', async () => {
      const error = new Error('storage down');
      bunnyService.upload.mockRejectedValue(error);

      const promise = service.uploadBookingPhoto('u1', { file: memoryFile() });

      await expect(promise).rejects.toBeInstanceOf(UploadPhotoFailedException);
      await expect(promise).rejects.toMatchObject({ response: error });
    });

    it('wraps non object errors', async () => {
      bunnyService.upload.mockRejectedValue('boom');

      await expect(
        service.uploadBookingPhoto('u1', { file: memoryFile() }),
      ).rejects.toMatchObject({
        response: { message: 'boom' },
        status: 500,
      });
    });
  });

  describe('fileSystemPhotoUpload', () => {
    const fileSystemFile = (overrides: Record<string, unknown> = {}) =>
      ({
        size: 100,
        extension: 'jpeg',
        originalName: 'Photo.jpeg',
        path: '/tmp/purepixel-local-storage/raw.jpeg',
        ...overrides,
      }) as unknown as FileSystemStoredFile;

    beforeEach(() => {
      photoProcessService.sharpInitFromFilePath.mockResolvedValue({
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('local')),
      });
    });

    it('throws when photo quota is exceeded', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        name: 'Khang',
        photoQuotaUsage: BigInt(900),
        maxPhotoQuota: BigInt(1000),
      });

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(RunOutPhotoQuotaException);
    });

    it('throws when extension is not supported', async () => {
      await expect(
        service.fileSystemPhotoUpload('u1', {
          file: fileSystemFile({ extension: 'webp' }),
        }),
      ).rejects.toBeInstanceOf(FileIsNotValidException);
    });

    it('throws when exif is missing', async () => {
      photoProcessService.parseExifFromFilePath.mockResolvedValue(undefined);

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(ExifNotFoundException);
    });

    it('throws when exif make is missing', async () => {
      photoProcessService.parseExifFromFilePath.mockResolvedValue({
        Model: 'R5',
      });

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(MissingMakeExifException);
    });

    it('throws when exif model is missing', async () => {
      photoProcessService.parseExifFromFilePath.mockResolvedValue({
        Make: 'Canon',
      });

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(MissingModelExifException);
    });

    it('throws when the photo hash already exists', async () => {
      photoProcessService.isExistHash.mockReturnValue(true);

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
      expect(photoProcessService.isExistHash).toHaveBeenCalledWith('hash', [
        'h1',
      ]);
    });

    it('throws when metadata has no size', async () => {
      photoProcessService.parseMetadataFromFilePath.mockResolvedValue({});

      await expect(
        service.fileSystemPhotoUpload('u1', { file: fileSystemFile() }),
      ).rejects.toBeInstanceOf(FileIsNotValidException);
    });

    it('creates a pending photo and queues upload and camera jobs', async () => {
      const file = fileSystemFile();

      const result = await service.fileSystemPhotoUpload('u1', { file });

      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: 'hash',
          status: 'PENDING',
          photoType: 'RAW',
          originalPhotoUrl: '/tmp/purepixel-local-storage/raw.jpeg',
          exif: {
            Make: 'Canon',
            Model: 'R5',
            Copyright: ' © copyright by Khang',
          },
        }),
      );
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        photoQuotaUsage: { increment: 100 },
      });
      expect(photoProcessQueue.add).toHaveBeenCalledWith(
        PhotoConstant.UPLOAD_PHOTO_JOB_NAME,
        { file, photoId: 'new' },
      );
      expect(cameraQueue.add).toHaveBeenCalledWith(
        CameraConstant.ADD_NEW_CAMERA_USAGE_JOB,
        { photoId: 'new' },
      );
      expect(result.signedUrl).toEqual(pendingUrl);
    });
  });

  describe('uploadPhoto', () => {
    it('throws when photo quota is exceeded', async () => {
      await expect(
        service.uploadPhoto('u1', { file: memoryFile({ size: 5000 }) }),
      ).rejects.toBeInstanceOf(RunOutPhotoQuotaException);
    });

    it.each(['bmp', 'bitmap'])('accepts %s extension', async (extension) => {
      await expect(
        service.uploadPhoto('u1', { file: memoryFile({ extension }) }),
      ).resolves.toBeInstanceOf(SignedPhotoDto);
    });

    it('throws when extension is not supported', async () => {
      await expect(
        service.uploadPhoto('u1', { file: memoryFile({ extension: 'tiff' }) }),
      ).rejects.toBeInstanceOf(FileIsNotValidException);
    });

    it.each([
      ['exif is missing', null, ExifNotFoundException],
      ['make is missing', { Model: 'R5' }, MissingMakeExifException],
      ['model is missing', { Make: 'Canon' }, MissingModelExifException],
    ])('rethrows when %s', async (_name, exif, exception) => {
      photoProcessService.parseExifFromBuffer.mockResolvedValue(exif);

      const promise = service.uploadPhoto('u1', { file: memoryFile() });

      await expect(promise).rejects.toBeInstanceOf(exception);
      await expect(promise).rejects.toBeInstanceOf(HttpException);
    });

    it('rethrows validation errors', async () => {
      photoValidateService.validateHashAndMatching.mockRejectedValue(
        new FailToPerformOnDuplicatedPhotoException(),
      );

      await expect(
        service.uploadPhoto('u1', { file: memoryFile() }),
      ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
      expect(bunnyService.upload).not.toHaveBeenCalled();
    });

    it('throws when metadata has no size', async () => {
      photoProcessService.parseMetadataFromBuffer.mockResolvedValue({
        width: 1000,
      });

      await expect(
        service.uploadPhoto('u1', { file: memoryFile() }),
      ).rejects.toBeInstanceOf(FileIsNotValidException);
    });

    it('uploads photo, stores exif and queues jobs', async () => {
      const file = memoryFile();

      const result = await service.uploadPhoto('u1', { file });

      expect(photoValidateService.validateHashAndMatching).toHaveBeenCalledWith(
        file.buffer,
        'Ảnh Đẹp.jpg',
      );
      expect(bunnyService.upload).toHaveBeenCalledWith(file);
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PARSED',
          photoType: 'RAW',
          originalPhotoUrl: 'u1/uploaded.jpg',
          exif: {
            Make: 'Canon',
            Model: 'R5',
            Copyright: ' © copyright by Khang',
          },
        }),
      );
      expect(photoProcessQueue.add).toHaveBeenCalledWith(
        PhotoConstant.PROCESS_PHOTO_JOB_NAME,
        { id: 'new' },
      );
      expect(cameraQueue.add).toHaveBeenCalledWith(
        CameraConstant.ADD_NEW_CAMERA_USAGE_JOB,
        { photoId: 'new' },
      );
      expect(result.signedUrl).toEqual(signedUrl);
    });

    it('wraps unknown errors', async () => {
      const error = new Error('exif parser crashed');
      photoProcessService.parseExifFromBuffer.mockRejectedValue(error);

      const promise = service.uploadPhoto('u1', { file: memoryFile() });

      await expect(promise).rejects.toBeInstanceOf(UploadPhotoFailedException);
      await expect(promise).rejects.toMatchObject({ response: error });
    });

    it('wraps non object errors', async () => {
      bunnyService.upload.mockRejectedValue(42);

      await expect(
        service.uploadPhoto('u1', { file: memoryFile() }),
      ).rejects.toMatchObject({ response: { message: '42' } });
    });
  });
});
