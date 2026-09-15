import { Queue } from 'bullmq';
import { MemoryStoredFile } from 'nestjs-form-data';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootPackageShowcaseRepository } from 'src/database/repositories/photoshoot-package-showcase.repository';
import { TemporaryfileService } from 'src/temporary-file/services/temporary-file.service';
import {
  PhotoshootPackage,
  PhotoshootPackageDetail,
} from 'src/database/types/photoshoot-package';
import { PhotoshootPackageDisabledException } from 'src/booking/exceptions/photoshoot-package-disabled.exception';
import { PhotoshootPackageService } from './photoshoot-package.service';
import { PhotoshootPackageConstant } from '../constants/photoshoot-package.constant';
import { RunOutOfPackageQuotaException } from '../exceptions/run-out-of-package-quota.exception';
import { PhotoshootPackageNotBelongException } from '../exceptions/photoshoot-package-not-belong.exception';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageShowcaseFindAllDto } from '../dtos/rest/photoshoot-package-showcase.find-all.request.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';
import { PhotoshootPackageShowcaseFindAllResponseDto } from '../dtos/rest/photoshoot-package-showcase.find-all.response.dto';
import { PhotoshootPackageShowcaseDto } from '../dtos/photoshoot-package-showcase.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { FileSystemPhotoshootPackageCreateRequestDto } from '../dtos/rest/file-system-photoshoot-package-create.request.dto';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { PhotoshootPackageShowcaseUpdateDto } from '../dtos/rest/photoshoot-package-showcase.update.dto';

jest.mock('uuid', () => ({ v4: () => 'uuid' }));

const updatedAt = new Date('2024-01-01T00:00:00.000Z');

const makePackageDetail = (
  overrides: Partial<PhotoshootPackageDetail> = {},
): PhotoshootPackageDetail =>
  ({
    id: 'package-id',
    userId: 'user-id',
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    price: 10000,
    thumbnail: 'thumbnail-key',
    status: 'ENABLED',
    sourceStatus: 'CLOUD',
    createdAt: updatedAt,
    updatedAt,
    deletedAt: null,
    showcases: [
      { id: 'showcase-1', photoUrl: 'showcase-1-key' },
      { id: 'showcase-2', photoUrl: 'showcase-2-key' },
    ],
    reviews: [],
    user: { id: 'user-id' },
    _count: { bookings: 0 },
    ...overrides,
  }) as unknown as PhotoshootPackageDetail;

const makePackage = (
  overrides: Partial<PhotoshootPackage> = {},
): PhotoshootPackage =>
  ({
    id: 'package-id',
    userId: 'user-id',
    thumbnail: 'thumbnail-key',
    status: 'ENABLED',
    sourceStatus: 'CLOUD',
    updatedAt,
    user: { id: 'user-id' },
    _count: { bookings: 0 },
    ...overrides,
  }) as unknown as PhotoshootPackage;

const makeFindAllDto = (
  values: Partial<PhotoshootPackageFindAllDto> = {},
): PhotoshootPackageFindAllDto =>
  Object.assign(new PhotoshootPackageFindAllDto(), {
    limit: 10,
    page: 0,
    ...values,
  });

describe('PhotoshootPackageService', () => {
  let service: PhotoshootPackageService;

  let photoshootRepository: {
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
    findAll: jest.Mock;
  };
  let userRepository: {
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
  };
  let photoProcessService: {
    uploadFromBuffer: jest.Mock;
    sharpInitFromBuffer: jest.Mock;
    makeThumbnail: jest.Mock;
  };
  let bunnyService: {
    getPresignedFile: jest.Mock;
    uploadFromBuffer: jest.Mock;
    delete: jest.Mock;
    upload: jest.Mock;
    pruneCache: jest.Mock;
  };
  let transaction: jest.Mock;
  let prisma: { extendedClient: jest.Mock };
  let showcaseRepository: {
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    findByIdOrThrow: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };
  let temporaryfileService: { signFilesystemPath: jest.Mock };
  let queue: { add: jest.Mock };

  beforeEach(() => {
    photoshootRepository = {
      findUniqueOrThrow: jest.fn(),
      create: jest.fn().mockReturnValue('create-query'),
      updateById: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
    };
    userRepository = {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn().mockReturnValue('update-query'),
    };
    photoProcessService = {
      uploadFromBuffer: jest.fn().mockResolvedValue(undefined),
      sharpInitFromBuffer: jest.fn().mockResolvedValue('sharp'),
      makeThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumb')),
    };
    bunnyService = {
      getPresignedFile: jest.fn(
        (key: string, query = '') => `signed:${key}${query}`,
      ),
      uploadFromBuffer: jest.fn().mockResolvedValue('uploaded-key'),
      delete: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue('new-key'),
      pruneCache: jest.fn().mockResolvedValue(undefined),
    };
    transaction = jest.fn();
    prisma = {
      extendedClient: jest.fn().mockReturnValue({ $transaction: transaction }),
    };
    showcaseRepository = {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findByIdOrThrow: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    temporaryfileService = {
      signFilesystemPath: jest.fn((path: string) => `fs:${path}`),
    };
    queue = { add: jest.fn().mockResolvedValue(undefined) };

    service = new PhotoshootPackageService(
      photoshootRepository as unknown as PhotoshootRepository,
      userRepository as unknown as UserRepository,
      photoProcessService as unknown as PhotoProcessService,
      bunnyService as unknown as BunnyService,
      prisma as unknown as PrismaService,
      showcaseRepository as unknown as PhotoshootPackageShowcaseRepository,
      temporaryfileService as unknown as TemporaryfileService,
      queue as unknown as Queue,
    );
  });

  describe('filesystemCreate', () => {
    const createDto = {
      title: 'title',
      subtitle: 'subtitle',
      description: 'description',
      price: 20000,
      thumbnail: { path: '/tmp/thumb.jpg' },
      showcases: [{ path: '/tmp/s1.jpg' }, { path: '/tmp/s2.jpg' }],
    } as unknown as FileSystemPhotoshootPackageCreateRequestDto;

    it('throws RunOutOfPackageQuotaException when quota is exhausted', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        packageCount: 5,
        maxPackageCount: 5,
      });

      await expect(
        service.filesystemCreate('user-id', createDto),
      ).rejects.toBeInstanceOf(RunOutOfPackageQuotaException);
      expect(transaction).not.toHaveBeenCalled();
    });

    it('creates package in transaction, queues upload and signs filesystem paths', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        packageCount: 1,
        maxPackageCount: 5,
      });
      const created = makePackageDetail({
        sourceStatus: 'FILESYSTEM',
        thumbnail: '/tmp/thumb.jpg',
        showcases: [
          { photoUrl: '/tmp/s1.jpg' },
        ] as unknown as PhotoshootPackageDetail['showcases'],
      });
      transaction.mockResolvedValue([created, {}]);

      const result = await service.filesystemCreate('user-id', createDto);

      expect(photoshootRepository.create).toHaveBeenCalledWith({
        user: { connect: { id: 'user-id' } },
        status: 'ENABLED',
        price: 20000,
        title: 'title',
        subtitle: 'subtitle',
        sourceStatus: 'FILESYSTEM',
        thumbnail: '/tmp/thumb.jpg',
        description: 'description',
        showcases: {
          create: [{ photoUrl: '/tmp/s1.jpg' }, { photoUrl: '/tmp/s2.jpg' }],
        },
      });
      expect(userRepository.update).toHaveBeenCalledWith('user-id', {
        packageCount: { increment: 1 },
      });
      expect(transaction).toHaveBeenCalledWith([
        'create-query',
        'update-query',
      ]);
      expect(queue.add).toHaveBeenCalledWith(
        PhotoshootPackageConstant.UPLOAD_TO_CLOUD,
        { photoshootPackageId: 'package-id' },
      );
      expect(result).toBeInstanceOf(PhotoshootPackageDto);
      expect(result.thumbnail).toBe('fs:/tmp/thumb.jpg');
      expect(result.showcases[0].photoUrl).toBe('fs:/tmp/s1.jpg');
      expect(bunnyService.getPresignedFile).not.toHaveBeenCalled();
    });
  });

  describe('findAllShowcase', () => {
    const findAllDto = Object.assign(
      new PhotoshootPackageShowcaseFindAllDto(),
      {
        limit: 2,
        page: 1,
      },
    );

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.findAllShowcase('user-id', 'package-id', findAllDto),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('returns paginated signed showcases', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.findMany.mockResolvedValue([
        { id: 's1', photoUrl: 'k1' },
        { id: 's2', photoUrl: 'k2' },
      ]);
      showcaseRepository.count.mockResolvedValue(3);

      const result = await service.findAllShowcase(
        'user-id',
        'package-id',
        findAllDto,
      );

      const where = {
        PhotoshootPackage: { userId: 'user-id', id: 'package-id' },
      };
      expect(showcaseRepository.findMany).toHaveBeenCalledWith(
        where,
        findAllDto.toSkip(),
        2,
        [{ createdAt: 'desc' }],
      );
      expect(showcaseRepository.count).toHaveBeenCalledWith(where);
      expect(result).toBeInstanceOf(
        PhotoshootPackageShowcaseFindAllResponseDto,
      );
      expect(result.totalRecord).toBe(3);
      expect(result.totalPage).toBe(2);
      expect(result.objects[0]).toBeInstanceOf(PhotoshootPackageShowcaseDto);
      expect(result.objects.map((o) => o.photoUrl)).toEqual([
        'signed:k1',
        'signed:k2',
      ]);
    });
  });

  describe('createShowcase', () => {
    const dto = {
      showcase: { buffer: Buffer.from('img') },
    } as unknown as PhotoshootPackageShowcaseUpdateDto;

    it('throws when package is disabled', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ status: 'DISABLED' }),
      );

      await expect(
        service.createShowcase('user-id', 'package-id', dto),
      ).rejects.toBeInstanceOf(PhotoshootPackageDisabledException);
    });

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.createShowcase('user-id', 'package-id', dto),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('uploads thumbnail and creates showcase', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.create.mockResolvedValue({
        id: 's1',
        photoUrl: 'uploaded-key',
      });

      const result = await service.createShowcase('user-id', 'package-id', dto);

      expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledWith(
        dto.showcase.buffer,
      );
      expect(photoProcessService.makeThumbnail).toHaveBeenCalledWith('sharp');
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'uuid.webp',
        expect.any(Buffer),
      );
      expect(showcaseRepository.create).toHaveBeenCalledWith({
        PhotoshootPackage: {
          connect: { id: 'package-id', userId: 'user-id' },
        },
        photoUrl: 'uploaded-key',
      });
      expect(result).toBeInstanceOf(PhotoshootPackageShowcaseDto);
      expect(result.photoUrl).toBe('signed:uploaded-key');
    });
  });

  describe('replaceShowcase', () => {
    const dto = {
      showcase: { buffer: Buffer.from('img') },
    } as unknown as PhotoshootPackageShowcaseUpdateDto;

    it('throws when package is disabled', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ status: 'DISABLED' }),
      );

      await expect(
        service.replaceShowcase('user-id', 'package-id', 's1', dto),
      ).rejects.toBeInstanceOf(PhotoshootPackageDisabledException);
    });

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.replaceShowcase('user-id', 'package-id', 's1', dto),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('throws PhotoshootPackageNotBelongException when showcase belongs to another package', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.findByIdOrThrow.mockResolvedValue({
        id: 's1',
        photoUrl: 'old-key',
        photoshootPackageId: 'other-package-id',
      });

      await expect(
        service.replaceShowcase('user-id', 'package-id', 's1', dto),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
      expect(bunnyService.delete).not.toHaveBeenCalled();
      expect(bunnyService.upload).not.toHaveBeenCalled();
      expect(showcaseRepository.updateById).not.toHaveBeenCalled();
    });

    it('deletes old photo, uploads new one and updates showcase', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.findByIdOrThrow.mockResolvedValue({
        id: 's1',
        photoUrl: 'old-key',
        photoshootPackageId: 'package-id',
      });
      showcaseRepository.updateById.mockResolvedValue({
        id: 's1',
        photoUrl: 'new-key',
      });

      const result = await service.replaceShowcase(
        'user-id',
        'package-id',
        's1',
        dto,
      );

      expect(bunnyService.delete).toHaveBeenCalledWith('old-key');
      expect(bunnyService.upload).toHaveBeenCalledWith(dto.showcase);
      expect(showcaseRepository.updateById).toHaveBeenCalledWith('s1', {
        photoUrl: 'new-key',
      });
      expect(result).toBeInstanceOf(PhotoshootPackageShowcaseDto);
      expect(result.photoUrl).toBe('signed:new-key');
    });
  });

  describe('deleteShowcase', () => {
    it('throws when package is disabled', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ status: 'DISABLED' }),
      );

      await expect(
        service.deleteShowcase('user-id', 'package-id', 's1'),
      ).rejects.toBeInstanceOf(PhotoshootPackageDisabledException);
    });

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.deleteShowcase('user-id', 'package-id', 's1'),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('throws PhotoshootPackageNotBelongException when showcase belongs to another package', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.findByIdOrThrow.mockResolvedValue({
        id: 's1',
        photoUrl: 'old-key',
        photoshootPackageId: 'other-package-id',
      });

      await expect(
        service.deleteShowcase('user-id', 'package-id', 's1'),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
      expect(bunnyService.delete).not.toHaveBeenCalled();
      expect(showcaseRepository.deleteById).not.toHaveBeenCalled();
    });

    it('deletes photo from storage and removes showcase', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      showcaseRepository.findByIdOrThrow.mockResolvedValue({
        id: 's1',
        photoUrl: 'old-key',
        photoshootPackageId: 'package-id',
      });

      const result = await service.deleteShowcase(
        'user-id',
        'package-id',
        's1',
      );

      expect(showcaseRepository.findByIdOrThrow).toHaveBeenCalledWith('s1');
      expect(bunnyService.delete).toHaveBeenCalledWith('old-key');
      expect(showcaseRepository.deleteById).toHaveBeenCalledWith('s1');
      expect(result).toBe(true);
    });
  });

  describe('replace', () => {
    const baseDto = {
      title: 'new title',
      subtitle: 'new subtitle',
      description: 'new description',
      price: 30000,
    };

    it('throws PhotoshootPackageDisabledException when package is disabled', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ status: 'DISABLED' }),
      );

      await expect(
        service.replace(
          'user-id',
          'package-id',
          baseDto as unknown as PhotoshootPackageReplaceRequestDto,
        ),
      ).rejects.toBeInstanceOf(PhotoshootPackageDisabledException);
      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(photoshootRepository.updateById).not.toHaveBeenCalled();
    });

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.replace(
          'user-id',
          'package-id',
          baseDto as unknown as PhotoshootPackageReplaceRequestDto,
        ),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('replaces without uploading thumbnail when none provided', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());

      const result = await service.replace(
        'user-id',
        'package-id',
        baseDto as unknown as PhotoshootPackageReplaceRequestDto,
      );

      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        baseDto,
      );
      expect(result.thumbnail).toBe('signed:thumbnail-key');
    });

    it('uploads thumbnail when provided', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());
      const buffer = Buffer.from('thumb');

      await service.replace('user-id', 'package-id', {
        ...baseDto,
        thumbnail: { buffer } as unknown as MemoryStoredFile,
      } as unknown as PhotoshootPackageReplaceRequestDto);

      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail-key',
        buffer,
      );
    });
  });

  describe('delete', () => {
    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.delete('user-id', 'package-id'),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
      expect(photoshootRepository.delete).not.toHaveBeenCalled();
    });

    it('soft deletes the package', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.delete.mockResolvedValue(makePackage());

      const result = await service.delete('user-id', 'package-id');

      expect(photoshootRepository.delete).toHaveBeenCalledWith('package-id');
      expect(result).toBeInstanceOf(PhotoshootPackageDto);
      expect(result.id).toBe('package-id');
    });
  });

  describe('update', () => {
    const baseDto = {
      title: 'new title',
      subtitle: 'new subtitle',
      description: 'new description',
      price: 30000,
    };

    it('throws when package is disabled', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ status: 'DISABLED' }),
      );

      await expect(
        service.update(
          'user-id',
          'package-id',
          baseDto as PhotoshootPackageUpdateRequestDto,
        ),
      ).rejects.toBeInstanceOf(PhotoshootPackageDisabledException);
    });

    it('throws when package does not belong to user', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail({ userId: 'other' }),
      );

      await expect(
        service.update(
          'user-id',
          'package-id',
          baseDto as PhotoshootPackageUpdateRequestDto,
        ),
      ).rejects.toBeInstanceOf(PhotoshootPackageNotBelongException);
    });

    it('updates fields without thumbnail', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());

      const result = await service.update(
        'user-id',
        'package-id',
        baseDto as PhotoshootPackageUpdateRequestDto,
      );

      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(bunnyService.pruneCache).not.toHaveBeenCalled();
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        baseDto,
      );
      expect(result.thumbnail).toBe(
        `signed:thumbnail-key?updatedAt=${updatedAt.getTime()}`,
      );
    });

    it('uploads thumbnail and prunes cache when thumbnail provided', async () => {
      process.env.BUNNY_STORAGE_CDN = 'https://cdn';
      process.env.BUNNY_STORAGE_BUCKET = 'bucket';
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());
      const buffer = Buffer.from('thumb');

      await service.update('user-id', 'package-id', {
        ...baseDto,
        thumbnail: { buffer } as unknown as MemoryStoredFile,
      });

      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail-key',
        buffer,
      );
      expect(bunnyService.pruneCache).toHaveBeenCalledWith(
        'https://cdn/bucket/thumbnail-key',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'title',
      subtitle: 'subtitle',
      description: 'description',
      price: 20000,
      thumbnail: { buffer: Buffer.from('thumb') },
      showcases: [{ buffer: Buffer.from('s1') }, { buffer: Buffer.from('s2') }],
    } as unknown as PhotoshootPackageCreateRequestDto;

    it('throws RunOutOfPackageQuotaException when quota is exhausted', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        packageCount: 6,
        maxPackageCount: 5,
      });

      await expect(service.create('user-id', createDto)).rejects.toBeInstanceOf(
        RunOutOfPackageQuotaException,
      );
      expect(photoProcessService.sharpInitFromBuffer).not.toHaveBeenCalled();
    });

    it('uploads thumbnail and showcases then creates package in transaction', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        packageCount: 0,
        maxPackageCount: 5,
      });
      transaction.mockResolvedValue([makePackageDetail(), {}]);

      const result = await service.create('user-id', createDto);

      expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledTimes(3);
      expect(photoProcessService.makeThumbnail).toHaveBeenCalledTimes(3);
      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'photoshoot_thumbnail/uuid.webp',
        expect.any(Buffer),
      );
      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'photoshoot_showcase/uuid.webp',
        expect.any(Buffer),
      );
      expect(photoshootRepository.create).toHaveBeenCalledWith({
        user: { connect: { id: 'user-id' } },
        status: 'ENABLED',
        price: 20000,
        title: 'title',
        subtitle: 'subtitle',
        thumbnail: 'photoshoot_thumbnail/uuid.webp',
        description: 'description',
        showcases: {
          create: [
            { photoUrl: 'photoshoot_showcase/uuid.webp' },
            { photoUrl: 'photoshoot_showcase/uuid.webp' },
          ],
        },
      });
      expect(transaction).toHaveBeenCalledWith([
        'create-query',
        'update-query',
      ]);
      expect(result.thumbnail).toBe(
        `signed:thumbnail-key?updatedAt=${updatedAt.getTime()}`,
      );
      expect(result.showcases.map((s) => s.photoUrl)).toEqual([
        'signed:showcase-1-key',
        'signed:showcase-2-key',
      ]);
    });
  });

  describe('signPhotoshootPackage', () => {
    it('signs cloud thumbnail with bunny', async () => {
      const result = await service.signPhotoshootPackage(makePackage());

      expect(result.thumbnail).toBe(
        `signed:thumbnail-key?updatedAt=${updatedAt.getTime()}`,
      );
    });

    it('signs filesystem thumbnail with temporary file service', async () => {
      const result = await service.signPhotoshootPackage(
        makePackage({ sourceStatus: 'FILESYSTEM' }),
      );

      expect(result.thumbnail).toBe('fs:thumbnail-key');
      expect(bunnyService.getPresignedFile).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns signed package detail', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );

      const result = await service.getById('package-id');

      expect(photoshootRepository.findUniqueOrThrow).toHaveBeenCalledWith(
        'package-id',
      );
      expect(result).toBeInstanceOf(PhotoshootPackageDto);
      expect(result.showcases).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('returns paginated signed packages', async () => {
      const findAllDto = makeFindAllDto({
        search: 'abc',
        statuses: ['ENABLED'],
      });
      photoshootRepository.count.mockResolvedValue(11);
      photoshootRepository.findAll.mockResolvedValue([
        makePackage(),
        makePackage({ id: 'p2', sourceStatus: 'FILESYSTEM' }),
      ]);

      const result = await service.findAll(findAllDto);

      expect(photoshootRepository.count).toHaveBeenCalledWith(
        findAllDto.toWhere(),
      );
      expect(photoshootRepository.findAll).toHaveBeenCalledWith(
        10,
        findAllDto.toSkip(),
        findAllDto.toWhere(),
        findAllDto.toOrderBy(),
      );
      expect(result).toBeInstanceOf(PhotoshootPackageFindAllResponseDto);
      expect(result.totalRecord).toBe(11);
      expect(result.totalPage).toBe(2);
      expect(result.objects.map((o) => o.thumbnail)).toEqual([
        `signed:thumbnail-key?updatedAt=${updatedAt.getTime()}`,
        'fs:thumbnail-key',
      ]);
    });
  });

  describe('findAllByUserId', () => {
    it('filters by user id and returns paginated packages', async () => {
      const findAllDto = makeFindAllDto();
      photoshootRepository.count.mockResolvedValue(1);
      photoshootRepository.findAll.mockResolvedValue([makePackage()]);

      const result = await service.findAllByUserId('user-id', findAllDto);

      expect(photoshootRepository.count).toHaveBeenCalledWith({
        userId: 'user-id',
      });
      expect(photoshootRepository.findAll).toHaveBeenCalledWith(
        10,
        0,
        { userId: 'user-id' },
        findAllDto.toOrderBy(),
      );
      expect(result.totalRecord).toBe(1);
      expect(result.objects).toHaveLength(1);
    });
  });
});
