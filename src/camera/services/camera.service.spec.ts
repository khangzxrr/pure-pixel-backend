import { MemoryStoredFile } from 'nestjs-form-data';
import { CameraMakerRepository } from 'src/database/repositories/camera-maker.repository';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PopularCameraTimelineRepository } from 'src/database/repositories/popular-camera-timeline.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { BunnyService } from 'src/storage/services/bunny.service';
import { CameraDto } from '../dtos/camera.dto';
import { MakerDto } from '../dtos/maker.dto';
import { PopularCameraTimelineDto } from '../dtos/popular-camera-timeline.dto';
import { FindAllCameraDto } from '../dtos/rest/find-all-camera.dto';
import { UpdateCameraDto } from '../dtos/rest/update-camera.dto';
import { CameraService } from './camera.service';

describe('CameraService', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  let cameraRepository: jest.Mocked<
    Pick<
      CameraRepository,
      | 'findFindOrThrow'
      | 'findByMakerId'
      | 'count'
      | 'findTopOrderByPhotoCount'
      | 'findTopUsageByUserCount'
      | 'findUniqueOrThrow'
      | 'update'
      | 'delete'
    >
  >;
  let cameraMakerRepository: jest.Mocked<
    Pick<CameraMakerRepository, 'findAll'>
  >;
  let cameraOnUsersRepository: jest.Mocked<
    Pick<CameraOnUsersRepository, 'countUserByCameraMakerId'>
  >;
  let popularCameraTimeline: jest.Mocked<
    Pick<PopularCameraTimelineRepository, 'findMany'>
  >;
  let bunnyService: jest.Mocked<Pick<BunnyService, 'uploadPublic'>>;
  let service: CameraService;

  beforeEach(() => {
    cameraRepository = {
      findFindOrThrow: jest.fn(),
      findByMakerId: jest.fn(),
      count: jest.fn(),
      findTopOrderByPhotoCount: jest.fn(),
      findTopUsageByUserCount: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    cameraMakerRepository = { findAll: jest.fn() };
    cameraOnUsersRepository = { countUserByCameraMakerId: jest.fn() };
    popularCameraTimeline = { findMany: jest.fn() };
    bunnyService = { uploadPublic: jest.fn() };

    service = new CameraService(
      cameraRepository as unknown as CameraRepository,
      cameraMakerRepository as unknown as CameraMakerRepository,
      cameraOnUsersRepository as unknown as CameraOnUsersRepository,
      {} as unknown as PhotoRepository,
      popularCameraTimeline as unknown as PopularCameraTimelineRepository,
      {} as unknown as UserRepository,
      bunnyService as unknown as BunnyService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findById', () => {
    it('should look up camera by id', async () => {
      cameraRepository.findFindOrThrow.mockResolvedValue({
        id: 'c1',
      } as never);

      await service.findById('c1');

      expect(cameraRepository.findFindOrThrow).toHaveBeenCalledWith('c1');
    });
  });

  describe('getPopularGraph', () => {
    it('should query timelines of last 7 days', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
      popularCameraTimeline.findMany.mockResolvedValue([
        { id: 't1', timestamp: now, popularCameraDataPoints: [] },
      ] as never);

      const result = await service.getPopularGraph();

      expect(popularCameraTimeline.findMany).toHaveBeenCalledWith({
        timestamp: {
          gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
        },
      });
      expect(result[0]).toBeInstanceOf(PopularCameraTimelineDto);
    });
  });

  describe('findTopCameraOfBrand', () => {
    it('should return camera dtos of brand', async () => {
      cameraRepository.findByMakerId.mockResolvedValue([
        { id: 'c1', name: 'A' },
      ] as never);

      const result = await service.findTopCameraOfBrand('m1', 4);

      expect(cameraRepository.findByMakerId).toHaveBeenCalledWith('m1', 4);
      expect(result[0]).toBeInstanceOf(CameraDto);
    });
  });

  describe('findTopBrand', () => {
    it('should sort brands by user count and take top n', async () => {
      cameraMakerRepository.findAll.mockResolvedValue([
        { id: 'm1', name: 'Canon' },
        { id: 'm2', name: 'Sony' },
        { id: 'm3', name: 'Nikon' },
      ] as never);
      cameraRepository.findByMakerId.mockImplementation(
        async (makerId: string) => [{ id: `${makerId}-cam` }] as never,
      );
      const userCounts: Record<string, number> = { m1: 5, m2: 20, m3: 1 };
      cameraOnUsersRepository.countUserByCameraMakerId.mockImplementation(
        async (id: string) => userCounts[id],
      );

      const result = await service.findTopBrand(2);

      expect(cameraRepository.findByMakerId).toHaveBeenCalledWith('m1', 5);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.userCount)).toEqual([20, 5]);
      expect(result[0].maker).toBeInstanceOf(MakerDto);
      expect(result[0].maker.name).toBe('Sony');
      expect(result[0].maker.cameras[0]).toBeInstanceOf(CameraDto);
    });
  });

  describe('findAll', () => {
    const makeDto = (overrides: Partial<FindAllCameraDto> = {}) =>
      Object.assign(new FindAllCameraDto(), {
        limit: 10,
        page: 1,
        ...overrides,
      });

    //a complete row as the raw SELECT * query returns it (counts are bigint)
    const cameraRow = (id: string) => ({
      id,
      name: `Camera ${id}`,
      thumbnail: '',
      description: '',
      cameraMakerId: 'm1',
      createdAt: new Date(0),
      updatedAt: new Date(0),
      deletedAt: null,
      photoCount: BigInt(0),
      userCount: BigInt(0),
    });

    beforeEach(() => {
      cameraRepository.count.mockResolvedValue(15);
      cameraRepository.findTopOrderByPhotoCount.mockResolvedValue([
        cameraRow('c1'),
      ]);
      cameraRepository.findTopUsageByUserCount.mockResolvedValue([
        cameraRow('c2'),
      ]);
    });

    it('should default to photo count desc with empty search', async () => {
      const dto = makeDto();

      const result = await service.findAll(dto);

      expect(cameraRepository.count).toHaveBeenCalledWith({});
      expect(cameraRepository.findTopOrderByPhotoCount).toHaveBeenCalledWith(
        '',
        'desc',
        10,
        10,
      );
      expect(result).toBeInstanceOf(PagingPaginatedResposneDto);
      expect(result?.totalPage).toBe(2);
      expect(result?.objects[0]).toBeInstanceOf(CameraDto);
    });

    it('should pass search in default ordering', async () => {
      await service.findAll(makeDto({ search: 'fuji' }));

      expect(cameraRepository.findTopOrderByPhotoCount).toHaveBeenCalledWith(
        'fuji',
        'desc',
        10,
        10,
      );
    });

    it('should order by photo count with requested direction', async () => {
      const result = await service.findAll(
        makeDto({ orderByTotalPhotoCount: 'asc', search: 'eos' }),
      );

      expect(cameraRepository.findTopOrderByPhotoCount).toHaveBeenCalledWith(
        'eos',
        'asc',
        10,
        10,
      );
      expect(cameraRepository.findTopUsageByUserCount).not.toHaveBeenCalled();
      expect(result?.totalRecord).toBe(15);
    });

    it('should order by photo count without search', async () => {
      await service.findAll(makeDto({ orderByTotalPhotoCount: 'desc' }));

      expect(cameraRepository.findTopOrderByPhotoCount).toHaveBeenCalledWith(
        '',
        'desc',
        10,
        10,
      );
    });

    it('should use user count query when ordering by user count', async () => {
      const result = await service.findAll(
        makeDto({ orderByTotalUserCount: 'asc', search: 'sony' }),
      );

      expect(cameraRepository.findTopUsageByUserCount).toHaveBeenCalledWith(
        'sony',
        expect.anything(),
        10,
        10,
      );
      expect(cameraRepository.findTopOrderByPhotoCount).not.toHaveBeenCalled();
      expect(result?.objects[0]).toMatchObject({ id: 'c2' });
    });

    it('should use user count query without search', async () => {
      await service.findAll(makeDto({ orderByTotalUserCount: 'desc' }));

      expect(cameraRepository.findTopUsageByUserCount).toHaveBeenCalledWith(
        '',
        expect.anything(),
        10,
        10,
      );
    });
  });

  describe('update', () => {
    it('should upload new thumbnail when provided', async () => {
      cameraRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'c1',
        thumbnail: 'old.png',
      } as never);
      bunnyService.uploadPublic.mockResolvedValue('https://cdn/c1.jpg');
      cameraRepository.update.mockResolvedValue({ id: 'c1' } as never);

      const file = { extension: 'jpg' } as unknown as MemoryStoredFile;
      const dto = Object.assign(new UpdateCameraDto(), {
        name: 'New',
        description: 'Desc',
        thumbnail: file,
      });

      const result = await service.update('c1', dto);

      expect(cameraRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'c1',
      });
      expect(bunnyService.uploadPublic).toHaveBeenCalledWith(file, 'c1.jpg');
      expect(cameraRepository.update).toHaveBeenCalledWith(
        { id: 'c1' },
        { name: 'New', thumbnail: 'https://cdn/c1.jpg', description: 'Desc' },
      );
      expect(result).toEqual({ id: 'c1' });
    });

    it('should keep existing thumbnail when not provided', async () => {
      cameraRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'c1',
        thumbnail: 'old.png',
      } as never);
      cameraRepository.update.mockResolvedValue({ id: 'c1' } as never);

      await service.update(
        'c1',
        Object.assign(new UpdateCameraDto(), { name: 'Only name' }),
      );

      expect(bunnyService.uploadPublic).not.toHaveBeenCalled();
      expect(cameraRepository.update).toHaveBeenCalledWith(
        { id: 'c1' },
        { name: 'Only name', thumbnail: 'old.png', description: undefined },
      );
    });

    it('should propagate not found error', async () => {
      cameraRepository.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.update('x', new UpdateCameraDto())).rejects.toThrow(
        'not found',
      );
      expect(cameraRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete camera by id', async () => {
      cameraRepository.delete.mockResolvedValue({ id: 'c1' } as never);

      await expect(service.delete('c1')).resolves.toEqual({ id: 'c1' });
      expect(cameraRepository.delete).toHaveBeenCalledWith({ id: 'c1' });
    });
  });
});
