import { MemoryStoredFile } from 'nestjs-form-data';
import { PhotoshootPackage } from '@prisma/client';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoshootPackageDetail } from 'src/database/types/photoshoot-package';
import { ManagePhotoshootPackageService } from './manage-photoshoot-package.service';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';

const makePackageDetail = (): PhotoshootPackageDetail =>
  ({
    id: 'package-id',
    userId: 'user-id',
    thumbnail: 'thumbnail-key',
    status: 'ENABLED',
    showcases: [
      { id: 's1', photoUrl: 'k1' },
      { id: 's2', photoUrl: 'k2' },
    ],
    reviews: [],
    user: { id: 'user-id' },
  }) as unknown as PhotoshootPackageDetail;

const makePackage = (id = 'package-id'): PhotoshootPackage =>
  ({
    id,
    userId: 'user-id',
    thumbnail: `${id}-thumb`,
    status: 'ENABLED',
  }) as unknown as PhotoshootPackage;

describe('ManagePhotoshootPackageService', () => {
  let service: ManagePhotoshootPackageService;
  let photoshootRepository: {
    updateById: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
    findAll: jest.Mock;
  };
  let photoProcessService: { uploadFromBuffer: jest.Mock };
  let bunnyService: { getPresignedFile: jest.Mock };

  const fieldsDto = {
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    price: 20000,
  };

  beforeEach(() => {
    photoshootRepository = {
      updateById: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
    };
    photoProcessService = {
      uploadFromBuffer: jest.fn().mockResolvedValue(undefined),
    };
    bunnyService = {
      getPresignedFile: jest.fn((key: string) => `signed:${key}`),
    };

    service = new ManagePhotoshootPackageService(
      photoshootRepository as unknown as PhotoshootRepository,
      photoProcessService as unknown as PhotoProcessService,
      bunnyService as unknown as BunnyService,
    );
  });

  describe('disable', () => {
    it('sets status to DISABLED', async () => {
      await expect(service.disable('package-id')).resolves.toBe(true);
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        { status: 'DISABLED' },
      );
    });
  });

  describe('enable', () => {
    it('sets status to ENABLED', async () => {
      await expect(service.enable('package-id')).resolves.toBe(true);
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        { status: 'ENABLED' },
      );
    });
  });

  describe('replace', () => {
    it('updates fields without uploading when no thumbnail', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());

      const result = await service.replace(
        'package-id',
        fieldsDto as unknown as PhotoshootPackageReplaceRequestDto,
      );

      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        fieldsDto,
      );
      expect(result).toBeInstanceOf(PhotoshootPackageDto);
      expect(result.thumbnail).toBe('signed:package-id-thumb');
    });

    it('uploads new thumbnail when provided', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());
      const buffer = Buffer.from('thumb');

      await service.replace('package-id', {
        ...fieldsDto,
        thumbnail: { buffer } as unknown as MemoryStoredFile,
      } as unknown as PhotoshootPackageReplaceRequestDto);

      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail-key',
        buffer,
      );
    });
  });

  describe('delete', () => {
    it('checks existence then deletes', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.delete.mockResolvedValue(makePackage());

      const result = await service.delete('package-id');

      expect(photoshootRepository.findUniqueOrThrow).toHaveBeenCalledWith(
        'package-id',
      );
      expect(photoshootRepository.delete).toHaveBeenCalledWith('package-id');
      expect(result).toBeInstanceOf(PhotoshootPackageDto);
    });

    it('propagates not found error', async () => {
      photoshootRepository.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.delete('package-id')).rejects.toThrow('not found');
      expect(photoshootRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates fields without uploading when no thumbnail', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());

      const result = await service.update(
        'package-id',
        fieldsDto as PhotoshootPackageUpdateRequestDto,
      );

      expect(photoProcessService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(result.thumbnail).toBe('signed:package-id-thumb');
    });

    it('uploads new thumbnail when provided', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );
      photoshootRepository.updateById.mockResolvedValue(makePackage());
      const buffer = Buffer.from('thumb');

      await service.update('package-id', {
        ...fieldsDto,
        thumbnail: { buffer } as unknown as MemoryStoredFile,
      });

      expect(photoProcessService.uploadFromBuffer).toHaveBeenCalledWith(
        'thumbnail-key',
        buffer,
      );
      expect(photoshootRepository.updateById).toHaveBeenCalledWith(
        'package-id',
        fieldsDto,
      );
    });
  });

  describe('getById', () => {
    it('returns signed detail including showcases', async () => {
      photoshootRepository.findUniqueOrThrow.mockResolvedValue(
        makePackageDetail(),
      );

      const result = await service.getById('package-id');

      expect(result).toBeInstanceOf(PhotoshootPackageDto);
      expect(result.thumbnail).toBe('signed:thumbnail-key');
      expect(result.showcases.map((s) => s.photoUrl)).toEqual([
        'signed:k1',
        'signed:k2',
      ]);
    });
  });

  describe('signPhotoshootPackage', () => {
    it('signs thumbnail', async () => {
      const result = await service.signPhotoshootPackage(makePackage());

      expect(result.thumbnail).toBe('signed:package-id-thumb');
    });
  });

  describe('findAll', () => {
    it('returns paginated signed packages', async () => {
      const findAllDto = Object.assign(new PhotoshootPackageFindAllDto(), {
        limit: 5,
        page: 0,
        statuses: ['DISABLED'],
      });
      photoshootRepository.count.mockResolvedValue(6);
      photoshootRepository.findAll.mockResolvedValue([
        makePackage('p1'),
        makePackage('p2'),
      ]);

      const result = await service.findAll(findAllDto);

      expect(photoshootRepository.count).toHaveBeenCalledWith({
        status: { in: ['DISABLED'] },
      });
      expect(photoshootRepository.findAll).toHaveBeenCalledWith(
        5,
        findAllDto.toSkip(),
        { status: { in: ['DISABLED'] } },
        [{ createdAt: 'desc' }],
      );
      expect(result).toBeInstanceOf(PhotoshootPackageFindAllResponseDto);
      expect(result.totalPage).toBe(2);
      expect(result.objects.map((o) => o.thumbnail)).toEqual([
        'signed:p1-thumb',
        'signed:p2-thumb',
      ]);
    });
  });

  describe('findAllByUserId', () => {
    it('adds user id filter', async () => {
      const findAllDto = Object.assign(new PhotoshootPackageFindAllDto(), {
        limit: 5,
        page: 0,
      });
      photoshootRepository.count.mockResolvedValue(1);
      photoshootRepository.findAll.mockResolvedValue([makePackage()]);

      const result = await service.findAllByUserId('user-id', findAllDto);

      expect(photoshootRepository.count).toHaveBeenCalledWith({
        userId: 'user-id',
      });
      expect(photoshootRepository.findAll).toHaveBeenCalledWith(
        5,
        findAllDto.toSkip(),
        { userId: 'user-id' },
        [{ createdAt: 'desc' }],
      );
      expect(result.totalRecord).toBe(1);
      expect(result.objects).toHaveLength(1);
    });
  });
});
