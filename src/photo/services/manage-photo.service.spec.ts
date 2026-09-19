import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { CategoryRepository } from 'src/database/repositories/category.repository';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/services/user.service';
import { PhotoConstant } from '../constants/photo.constant';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { CannotUpdateWatermarkPhotoHasActiveSellingException } from '../exceptions/cannot-update-watermark-photo-has-active-selling.exception';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { DuplicatedTagFoundException } from '../exceptions/duplicated-tag-found.exception';
import { ExifNotFoundException } from '../exceptions/exif-not-found.exception';
import { ManagePhotoService } from './manage-photo.service';
import { PhotoService } from './photo.service';

describe('ManagePhotoService', () => {
  let photoRepository: Record<
    | 'findUniqueOrThrow'
    | 'count'
    | 'findAll'
    | 'updateByIdQuery'
    | 'deleteById',
    jest.Mock
  >;
  let categoryRepository: Record<'findMany', jest.Mock>;
  let photoService: Record<
    'signPhotoDetail' | 'signPhotos' | 'signPhoto',
    jest.Mock
  >;
  let photoTagRepository: Record<'deleteByPhotoId' | 'create', jest.Mock>;
  let userService: Record<'updatePhotoQuota', jest.Mock>;
  let queue: Record<'add', jest.Mock>;
  let transaction: jest.Mock;
  let service: ManagePhotoService;

  const buildPhoto = (overrides: Record<string, unknown> = {}) => ({
    id: 'p1',
    title: 'Old Title',
    photographerId: 'u1',
    size: 100,
    exif: { Make: 'Canon' },
    photoSellings: [],
    ...overrides,
  });

  beforeEach(() => {
    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue(buildPhoto()),
      count: jest.fn().mockResolvedValue(25),
      findAll: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      updateByIdQuery: jest.fn().mockReturnValue('update-query'),
      deleteById: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    categoryRepository = {
      findMany: jest.fn().mockResolvedValue([{ id: 'c1' }]),
    };
    photoService = {
      signPhotoDetail: jest.fn().mockResolvedValue('signed-detail'),
      signPhotos: jest.fn().mockResolvedValue(['signed']),
      signPhoto: jest.fn().mockResolvedValue('signed-photo'),
    };
    photoTagRepository = {
      deleteByPhotoId: jest.fn().mockReturnValue('delete-tags'),
      create: jest.fn((id: string, tag: string) => `create-${tag}`),
    };
    userService = { updatePhotoQuota: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn().mockResolvedValue({}) };
    transaction = jest
      .fn()
      .mockImplementation(async (queries: unknown[]) => [
        ...queries.slice(0, -1),
        { id: 'p1', title: 'updated' },
      ]);

    service = new ManagePhotoService(
      photoRepository as unknown as PhotoRepository,
      categoryRepository as unknown as CategoryRepository,
      photoService as unknown as PhotoService,
      photoTagRepository as unknown as PhotoTagRepository,
      userService as unknown as UserService,
      queue as unknown as Queue,
      {
        extendedClient: jest
          .fn()
          .mockReturnValue({ $transaction: transaction }),
      } as unknown as PrismaService,
    );
  });

  it('finds a photo by id and signs its detail', async () => {
    await expect(service.findById('p1')).resolves.toBe('signed-detail');
    expect(photoService.signPhotoDetail).toHaveBeenCalledWith(buildPhoto());
  });

  it('finds all photos with paging', async () => {
    const dto = Object.assign(new FindAllPhotoFilterDto(), {
      limit: 10,
      page: 1,
      title: 'abc',
    });

    const result = await service.findAll(dto);

    expect(photoRepository.count).toHaveBeenCalledWith(dto.toWhere(''));
    expect(photoRepository.findAll).toHaveBeenCalledWith(
      dto.toWhere(''),
      [],
      10,
      10,
    );
    expect(result).toBeInstanceOf(PagingPaginatedResposneDto);
    expect(result).toMatchObject({
      totalRecord: 25,
      totalPage: 3,
      objects: ['signed'],
    });
  });

  it('queues a ban job', async () => {
    await expect(service.ban('p1')).resolves.toBe(true);
    expect(queue.add).toHaveBeenCalledWith(PhotoConstant.BAN_PHOTO_JOB, {
      id: 'p1',
    });
  });

  it('queues an unban job', async () => {
    await expect(service.unban('p1')).resolves.toBe(true);
    expect(queue.add).toHaveBeenCalledWith(PhotoConstant.UNBAN_PHOTO_JOB, {
      id: 'p1',
    });
  });

  it('deletes a photo and restores the quota', async () => {
    await expect(service.delete('p1')).resolves.toEqual({ id: 'p1' });
    expect(userService.updatePhotoQuota).toHaveBeenCalledWith('u1', 100);
    expect(photoRepository.deleteById).toHaveBeenCalledWith('p1');
  });

  describe('update', () => {
    it('throws when some categories are not found', async () => {
      await expect(
        service.update('p1', { categoryIds: ['c1', 'c2'] }),
      ).rejects.toBeInstanceOf(CategoryNotFoundException);
    });

    it.each([null, ['array'], 'text'])(
      'throws when updating gps without valid exif (%p)',
      async (exif) => {
        photoRepository.findUniqueOrThrow.mockResolvedValue(
          buildPhoto({ exif }),
        );

        await expect(
          service.update('p1', { gps: { latitude: 1, longitude: 2 } }),
        ).rejects.toBeInstanceOf(ExifNotFoundException);
      },
    );

    it('throws when photo tags are duplicated', async () => {
      await expect(
        service.update('p1', { photoTags: ['a', 'a'] }),
      ).rejects.toBeInstanceOf(DuplicatedTagFoundException);
    });

    it('throws when enabling watermark on photo with active selling', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ photoSellings: [{ active: true }] }),
      );

      await expect(
        service.update('p1', { watermark: true }),
      ).rejects.toBeInstanceOf(
        CannotUpdateWatermarkPhotoHasActiveSellingException,
      );
    });

    it('updates all fields in one transaction', async () => {
      const result = await service.update('p1', {
        categoryIds: ['c1'],
        gps: { latitude: 10, longitude: 106 },
        photoTags: ['a', 'b'],
        title: 'New Title',
        description: 'desc',
        photoType: 'RAW',
        visibility: 'PUBLIC',
        watermark: true,
      });

      expect(photoTagRepository.deleteByPhotoId).toHaveBeenCalledWith('p1');
      expect(photoTagRepository.create).toHaveBeenCalledWith('p1', 'a');
      expect(photoTagRepository.create).toHaveBeenCalledWith('p1', 'b');
      expect(photoRepository.updateByIdQuery).toHaveBeenCalledWith('p1', {
        categories: { connect: [{ id: 'c1' }] },
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
      expect(photoService.signPhoto).toHaveBeenCalledWith({
        id: 'p1',
        title: 'updated',
      });
      expect(result).toBe('signed-photo');
    });

    it('drops visibility when photo has active selling and uses defaults', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ exif: null, photoSellings: [{ active: true }] }),
      );

      await service.update('p1', { visibility: 'PRIVATE' });

      expect(categoryRepository.findMany).not.toHaveBeenCalled();
      expect(photoRepository.updateByIdQuery).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          categories: { connect: [] },
          visibility: undefined,
          normalizedTitle: 'old title',
          exif: Prisma.JsonNull,
        }),
      );
      expect(transaction).toHaveBeenCalledWith(['update-query']);
    });
  });
});
