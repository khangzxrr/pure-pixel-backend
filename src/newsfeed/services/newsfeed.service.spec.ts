import { NewsfeedRepository } from 'src/database/repositories/newsfeed.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotoService } from 'src/photo/services/photo.service';
import { NewsfeedDto } from '../dtos/newsfeed.dto';
import { NewsfeedCreateDto } from '../dtos/newsfeed.create.dto';
import { NewsfeedFindAllResponseDto } from '../dtos/rest/newfeed-find-all.response.dto';
import { NewsfeedFindAllDto } from '../dtos/rest/newsfeed-find-all.dto';
import { InsufficientPermissionToPerformOnNewsfeedException } from '../exceptions/insufficient-permission-to-perform-on-newsfeed.exception';
import { NewsfeedNotBelongException } from '../exceptions/newsfeed-not-belong.exception';
import { SomePhotoNotFoundException } from '../exceptions/some-photo-not-found.exception';
import { SomeUserNotFoundException } from '../exceptions/some-user-not-found.exception';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedService', () => {
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findManyWithoutPaging' | 'findUniqueOrThrow'>
  >;
  let photoRepository: jest.Mocked<
    Pick<PhotoRepository, 'findAllWithoutPaging'>
  >;
  let newsfeedRepository: jest.Mocked<
    Pick<
      NewsfeedRepository,
      'count' | 'findUniqueOrThrow' | 'update' | 'create' | 'findMany'
    >
  >;
  let photoService: jest.Mocked<Pick<PhotoService, 'signPhotos'>>;
  let service: NewsfeedService;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    userRepository = {
      findManyWithoutPaging: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    };
    photoRepository = { findAllWithoutPaging: jest.fn() };
    newsfeedRepository = {
      count: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    };
    photoService = { signPhotos: jest.fn() };

    service = new NewsfeedService(
      userRepository as unknown as UserRepository,
      photoRepository as unknown as PhotoRepository,
      newsfeedRepository as unknown as NewsfeedRepository,
      photoService as unknown as PhotoService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validatePermission', () => {
    it('should pass when newsfeed is visible to user', async () => {
      newsfeedRepository.count.mockResolvedValue(1);

      await expect(
        service.validatePermission('u1', 'n1'),
      ).resolves.toBeUndefined();

      const where = newsfeedRepository.count.mock.calls[0][0];
      expect(where.id).toBe('n1');
      expect(where.AND).toEqual([
        { permissions: { none: { userId: 'u1', permission: 'DENY' } } },
      ]);
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { visibility: 'PUBLIC' },
          { visibility: 'ONLY_ME', userId: 'u1' },
        ]),
      );
    });

    it('should throw when user has no permission', async () => {
      newsfeedRepository.count.mockResolvedValue(0);

      await expect(
        service.validatePermission('u1', 'n1'),
      ).rejects.toBeInstanceOf(
        InsufficientPermissionToPerformOnNewsfeedException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      newsfeedRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'n1',
        userId: 'u1',
      } as never);
      newsfeedRepository.update.mockResolvedValue({
        id: 'n1',
        title: 'new',
      } as never);
    });

    it('should throw when newsfeed belongs to another user', async () => {
      await expect(
        service.update('other', 'n1', { title: 'x' }),
      ).rejects.toBeInstanceOf(NewsfeedNotBelongException);
      expect(newsfeedRepository.update).not.toHaveBeenCalled();
    });

    it('should update basic fields only', async () => {
      const result = await service.update('u1', 'n1', {
        title: 'new',
        description: 'd',
        visibility: 'PUBLIC',
      });

      expect(newsfeedRepository.findUniqueOrThrow).toHaveBeenCalledWith(
        { id: 'n1' },
        {},
      );
      expect(photoRepository.findAllWithoutPaging).not.toHaveBeenCalled();
      expect(userRepository.findManyWithoutPaging).not.toHaveBeenCalled();
      expect(newsfeedRepository.update).toHaveBeenCalledWith(
        { id: 'n1' },
        { title: 'new', description: 'd', visibility: 'PUBLIC' },
      );
      expect(result).toBeInstanceOf(NewsfeedDto);
    });

    it('should replace photos and permissions', async () => {
      photoRepository.findAllWithoutPaging.mockResolvedValue([
        { id: 'p1' },
        { id: 'p2' },
      ] as never);
      userRepository.findManyWithoutPaging.mockResolvedValue([
        { id: 'u2' },
      ] as never);

      await service.update('u1', 'n1', {
        photos: ['p1', 'p2'],
        permissions: [{ userId: 'u2', permission: 'ALLOW' }],
      });

      expect(photoRepository.findAllWithoutPaging).toHaveBeenCalledWith({
        id: { in: ['p1', 'p2'] },
        photographerId: 'u1',
      });
      expect(userRepository.findManyWithoutPaging).toHaveBeenCalledWith({
        id: { in: ['u2'] },
      });
      expect(newsfeedRepository.update).toHaveBeenCalledWith(
        { id: 'n1' },
        {
          title: undefined,
          description: undefined,
          visibility: undefined,
          photos: {
            deleteMany: {},
            connect: [{ id: 'p1' }, { id: 'p2' }],
          },
          permissions: {
            deleteMany: {},
            create: [{ user: { connect: { id: 'u2' } }, permission: 'ALLOW' }],
          },
        },
      );
    });

    it('should throw when some photos are not found', async () => {
      photoRepository.findAllWithoutPaging.mockResolvedValue([
        { id: 'p1' },
      ] as never);

      await expect(
        service.update('u1', 'n1', { photos: ['p1', 'p2'] }),
      ).rejects.toBeInstanceOf(SomePhotoNotFoundException);
      expect(newsfeedRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when some users are not found', async () => {
      userRepository.findManyWithoutPaging.mockResolvedValue([] as never);

      await expect(
        service.update('u1', 'n1', {
          permissions: [{ userId: 'u2', permission: 'DENY' }],
        }),
      ).rejects.toBeInstanceOf(SomeUserNotFoundException);
      expect(newsfeedRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const makeCreateDto = (): NewsfeedCreateDto =>
      Object.assign(new NewsfeedCreateDto(), {
        title: 'T',
        description: 'D',
        visibility: 'ONLY_CHOOSED',
        photos: ['p1'],
        permissions: [{ userId: 'u2', permission: 'ALLOW' }],
      });

    it('should create newsfeed with photos and permissions', async () => {
      photoRepository.findAllWithoutPaging.mockResolvedValue([
        { id: 'p1' },
      ] as never);
      userRepository.findManyWithoutPaging.mockResolvedValue([
        { id: 'u2' },
      ] as never);
      userRepository.findUniqueOrThrow.mockResolvedValue({ id: 'u2' } as never);
      const created = { id: 'n1' };
      newsfeedRepository.create.mockResolvedValue(created as never);

      const result = await service.create('u1', makeCreateDto());

      expect(photoRepository.findAllWithoutPaging).toHaveBeenCalledWith({
        id: { in: ['p1'] },
        photographerId: 'u1',
      });
      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('u2');
      expect(newsfeedRepository.create).toHaveBeenCalledWith({
        user: { connect: { id: 'u1' } },
        permissions: {
          create: [{ user: { connect: { id: 'u2' } }, permission: 'ALLOW' }],
        },
        photos: { connect: [{ id: 'p1' }] },
        title: 'T',
        description: 'D',
        visibility: 'ONLY_CHOOSED',
      });
      expect(result).toBe(created);
    });

    it('should throw when some photos are not found', async () => {
      photoRepository.findAllWithoutPaging.mockResolvedValue([] as never);

      await expect(
        service.create('u1', makeCreateDto()),
      ).rejects.toBeInstanceOf(SomePhotoNotFoundException);
      expect(newsfeedRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when some users are not found', async () => {
      photoRepository.findAllWithoutPaging.mockResolvedValue([
        { id: 'p1' },
      ] as never);
      userRepository.findManyWithoutPaging.mockResolvedValue([] as never);

      await expect(
        service.create('u1', makeCreateDto()),
      ).rejects.toBeInstanceOf(SomeUserNotFoundException);
      expect(newsfeedRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const makeDto = (visibility?: NewsfeedFindAllDto['visibility']) =>
      Object.assign(new NewsfeedFindAllDto(), {
        limit: 10,
        page: 1,
        visibility,
      });

    beforeEach(() => {
      newsfeedRepository.count.mockResolvedValue(12);
      newsfeedRepository.findMany.mockResolvedValue([
        { id: 'n1', title: 'A', photos: [{ id: 'p1' }] },
        { id: 'n2', title: 'B', photos: [] },
      ] as never);
      photoService.signPhotos.mockImplementation(
        async (photos) => photos.map((p) => ({ ...p, signed: true })) as never,
      );
    });

    it('should default visibility to public, following and own newsfeeds', async () => {
      const dto = makeDto();

      const result = await service.findAll('u1', dto);

      expect(dto.visibility).toEqual(['PUBLIC', 'ONLY_ME', 'ONLY_FOLLOWING']);

      const where = newsfeedRepository.count.mock.calls[0][0];
      expect(where.OR).toEqual([
        { visibility: 'PUBLIC' },
        {
          AND: [
            { visibility: 'ONLY_FOLLOWING' },
            { user: { followers: { some: { followerId: 'u1' } } } },
          ],
        },
        { AND: [{ visibility: 'ONLY_ME', userId: 'u1' }] },
      ]);
      expect(where.AND).toEqual([
        { permissions: { none: { userId: 'u1', permission: 'DENY' } } },
      ]);
      expect(newsfeedRepository.findMany).toHaveBeenCalledWith(
        where,
        expect.objectContaining({ photos: true }),
        10,
        10,
      );

      expect(result).toBeInstanceOf(NewsfeedFindAllResponseDto);
      expect(result.totalPage).toBe(2);
      expect(result.objects).toHaveLength(2);
      expect(result.objects[0]).toBeInstanceOf(NewsfeedDto);
      expect(photoService.signPhotos).toHaveBeenCalledWith([{ id: 'p1' }]);
      expect(result.objects[0].photos).toEqual([{ id: 'p1', signed: true }]);
    });

    it('should apply defaults when visibility is empty', async () => {
      const dto = makeDto([]);

      await service.findAll('u1', dto);

      expect(dto.visibility).toEqual(['PUBLIC', 'ONLY_ME', 'ONLY_FOLLOWING']);
    });

    it('should filter only chosen newsfeeds when requested', async () => {
      await service.findAll('u1', makeDto(['ONLY_CHOOSED']));

      const where = newsfeedRepository.count.mock.calls[0][0];
      expect(where.OR).toEqual([
        {
          AND: [
            {
              visibility: 'ONLY_CHOOSED',
              permissions: { some: { userId: 'u1', permission: 'ALLOW' } },
            },
          ],
        },
      ]);
    });
  });
});
