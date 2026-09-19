import { ChangeLog } from '@prisma/client';
import { ChangeLogRepository } from 'src/database/repositories/change-log.repository';
import { ChangeLogDto } from '../dtos/change-log.dto';
import { ChangeLogCreateRequestDto } from '../dtos/rest/change-log-create.request.dto';
import { ChangeLogFindAllRequestDto } from '../dtos/rest/change-log-find-all.request.dto';
import { ChangeLogFindAllResponseDto } from '../dtos/rest/change-log-find-all.response.dto';
import { ChangeLogService } from './change-log.service';

describe('ChangeLogService', () => {
  const now = new Date('2026-09-15T10:00:00.000Z');
  const earlier = new Date('2026-01-01T00:00:00.000Z');

  let changeLogRepository: jest.Mocked<
    Pick<
      ChangeLogRepository,
      | 'count'
      | 'findAll'
      | 'findFirst'
      | 'create'
      | 'findByIdOrThrow'
      | 'updateById'
      | 'deleteById'
    >
  >;
  let service: ChangeLogService;

  const makeChangeLog = (overrides: Partial<ChangeLog> = {}): ChangeLog => ({
    id: 'cl1',
    version: '1.0.0',
    title: 'Release',
    content: '<p>notes</p>',
    status: 'DRAFT',
    publishedAt: null,
    authorId: 'author',
    createdAt: earlier,
    updatedAt: earlier,
    ...overrides,
  });

  const makeFindAllDto = (
    overrides: Partial<ChangeLogFindAllRequestDto> = {},
  ) =>
    Object.assign(new ChangeLogFindAllRequestDto(), {
      limit: 10,
      page: 2,
      ...overrides,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    changeLogRepository = {
      count: jest.fn(),
      findAll: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findByIdOrThrow: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    service = new ChangeLogService(
      changeLogRepository as unknown as ChangeLogRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findPublished', () => {
    it('should force PUBLISHED status and order by publishedAt', async () => {
      changeLogRepository.count.mockResolvedValue(25);
      changeLogRepository.findAll.mockResolvedValue([
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      ]);

      const dto = makeFindAllDto({ search: 'fix', status: 'DRAFT' });

      const result = await service.findPublished(dto);

      const expectedWhere = { ...dto.toWhere(), status: 'PUBLISHED' };

      expect(changeLogRepository.count).toHaveBeenCalledWith(expectedWhere);
      expect(changeLogRepository.findAll).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        where: expectedWhere,
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toBeInstanceOf(ChangeLogFindAllResponseDto);
      expect(result.totalRecord).toBe(25);
      expect(result.totalPage).toBe(3);
      expect(result.objects[0]).toBeInstanceOf(ChangeLogDto);
    });
  });

  describe('findLatestPublished', () => {
    it('should return dto of latest published entry', async () => {
      changeLogRepository.findFirst.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      );

      const result = await service.findLatestPublished();

      expect(changeLogRepository.findFirst).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toBeInstanceOf(ChangeLogDto);
      expect(result?.id).toBe('cl1');
    });

    it('should return null when nothing is published', async () => {
      changeLogRepository.findFirst.mockResolvedValue(null);

      await expect(service.findLatestPublished()).resolves.toBeNull();
    });
  });

  describe('findAll', () => {
    it('should include drafts and order by createdAt', async () => {
      changeLogRepository.count.mockResolvedValue(1);
      changeLogRepository.findAll.mockResolvedValue([makeChangeLog()]);

      const dto = makeFindAllDto({ page: 0 });

      const result = await service.findAll(dto);

      expect(changeLogRepository.count).toHaveBeenCalledWith({});
      expect(changeLogRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(result.objects).toHaveLength(1);
      expect(result.totalPage).toBe(1);
    });
  });

  describe('create', () => {
    const baseCreate = (status: ChangeLog['status']) =>
      Object.assign(new ChangeLogCreateRequestDto(), {
        version: '2.0.0',
        title: 'Big',
        content: '<p>big</p>',
        status,
      });

    it('should set publishedAt to now when created as PUBLISHED', async () => {
      changeLogRepository.create.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: now }),
      );

      const result = await service.create('author', baseCreate('PUBLISHED'));

      expect(changeLogRepository.create).toHaveBeenCalledWith({
        version: '2.0.0',
        title: 'Big',
        content: '<p>big</p>',
        status: 'PUBLISHED',
        publishedAt: now,
        authorId: 'author',
      });
      expect(result).toBeInstanceOf(ChangeLogDto);
    });

    it('should leave publishedAt null when created as DRAFT', async () => {
      changeLogRepository.create.mockResolvedValue(makeChangeLog());

      await service.create('author', baseCreate('DRAFT'));

      expect(changeLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', publishedAt: null }),
      );
    });
  });

  describe('update', () => {
    it('should stamp publishedAt when publishing a draft', async () => {
      changeLogRepository.findByIdOrThrow.mockResolvedValue(makeChangeLog());
      changeLogRepository.updateById.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: now }),
      );

      const result = await service.update('cl1', { status: 'PUBLISHED' });

      expect(changeLogRepository.findByIdOrThrow).toHaveBeenCalledWith('cl1');
      expect(changeLogRepository.updateById).toHaveBeenCalledWith('cl1', {
        version: undefined,
        title: undefined,
        content: undefined,
        status: 'PUBLISHED',
        publishedAt: now,
      });
      expect(result).toBeInstanceOf(ChangeLogDto);
    });

    it('should keep original publishedAt when re-saving a published entry', async () => {
      changeLogRepository.findByIdOrThrow.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      );
      changeLogRepository.updateById.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      );

      await service.update('cl1', { status: 'PUBLISHED', title: 'Edited' });

      expect(changeLogRepository.updateById).toHaveBeenCalledWith(
        'cl1',
        expect.objectContaining({
          title: 'Edited',
          status: 'PUBLISHED',
          publishedAt: earlier,
        }),
      );
    });

    it('should clear publishedAt when moving back to draft', async () => {
      changeLogRepository.findByIdOrThrow.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      );
      changeLogRepository.updateById.mockResolvedValue(makeChangeLog());

      await service.update('cl1', { status: 'DRAFT' });

      expect(changeLogRepository.updateById).toHaveBeenCalledWith(
        'cl1',
        expect.objectContaining({ status: 'DRAFT', publishedAt: null }),
      );
    });

    it('should not touch publishedAt when status is not provided', async () => {
      changeLogRepository.findByIdOrThrow.mockResolvedValue(
        makeChangeLog({ status: 'PUBLISHED', publishedAt: earlier }),
      );
      changeLogRepository.updateById.mockResolvedValue(makeChangeLog());

      await service.update('cl1', { content: 'new' });

      expect(changeLogRepository.updateById).toHaveBeenCalledWith('cl1', {
        version: undefined,
        title: undefined,
        content: 'new',
        status: undefined,
        publishedAt: undefined,
      });
    });

    it('should propagate not found errors without updating', async () => {
      changeLogRepository.findByIdOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.update('missing', { status: 'DRAFT' }),
      ).rejects.toThrow('not found');
      expect(changeLogRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete existing entry and return true', async () => {
      changeLogRepository.findByIdOrThrow.mockResolvedValue(makeChangeLog());
      changeLogRepository.deleteById.mockResolvedValue(makeChangeLog());

      await expect(service.delete('cl1')).resolves.toBe(true);
      expect(changeLogRepository.deleteById).toHaveBeenCalledWith('cl1');
    });

    it('should not delete when entry does not exist', async () => {
      changeLogRepository.findByIdOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.delete('missing')).rejects.toThrow('not found');
      expect(changeLogRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
