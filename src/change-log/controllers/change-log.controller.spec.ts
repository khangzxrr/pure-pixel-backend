import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ChangeLogCreateRequestDto } from '../dtos/rest/change-log-create.request.dto';
import { ChangeLogFindAllRequestDto } from '../dtos/rest/change-log-find-all.request.dto';
import { ChangeLogService } from '../services/change-log.service';
import { ChangeLogController } from './change-log.controller';

describe('ChangeLogController', () => {
  let changeLogService: jest.Mocked<
    Pick<
      ChangeLogService,
      | 'findPublished'
      | 'findLatestPublished'
      | 'findAll'
      | 'create'
      | 'update'
      | 'delete'
    >
  >;
  let controller: ChangeLogController;

  const findAllDto = Object.assign(new ChangeLogFindAllRequestDto(), {
    limit: 5,
    page: 0,
  });

  beforeEach(() => {
    changeLogService = {
      findPublished: jest.fn(),
      findLatestPublished: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new ChangeLogController(
      changeLogService as unknown as ChangeLogService,
    );
  });

  it('should return published entries', async () => {
    const response = { objects: [] };
    changeLogService.findPublished.mockResolvedValue(response as never);

    await expect(controller.findPublished(findAllDto)).resolves.toBe(response);
    expect(changeLogService.findPublished).toHaveBeenCalledWith(findAllDto);
  });

  it('should return latest published entry', async () => {
    changeLogService.findLatestPublished.mockResolvedValue(null);

    await expect(controller.findLatestPublished()).resolves.toBeNull();
    expect(changeLogService.findLatestPublished).toHaveBeenCalled();
  });

  it('should return all entries for managers', async () => {
    const response = { objects: [] };
    changeLogService.findAll.mockResolvedValue(response as never);

    await expect(controller.findAll(findAllDto)).resolves.toBe(response);
    expect(changeLogService.findAll).toHaveBeenCalledWith(findAllDto);
  });

  it('should create entry with author from token', async () => {
    const createDto = Object.assign(new ChangeLogCreateRequestDto(), {
      version: '1.0.0',
      title: 't',
      content: 'c',
      status: 'DRAFT',
    });
    const created = { id: 'cl1' };
    changeLogService.create.mockResolvedValue(created as never);

    await expect(
      controller.create(
        { sub: 'author' } as unknown as ParsedUserDto,
        createDto,
      ),
    ).resolves.toBe(created);
    expect(changeLogService.create).toHaveBeenCalledWith('author', createDto);
  });

  it('should update entry by id', async () => {
    const updated = { id: 'cl1' };
    changeLogService.update.mockResolvedValue(updated as never);

    await expect(controller.updateById('cl1', { title: 'new' })).resolves.toBe(
      updated,
    );
    expect(changeLogService.update).toHaveBeenCalledWith('cl1', {
      title: 'new',
    });
  });

  it('should delete entry by id', async () => {
    changeLogService.delete.mockResolvedValue(true);

    await expect(controller.deleteById('cl1')).resolves.toBe(true);
    expect(changeLogService.delete).toHaveBeenCalledWith('cl1');
  });
});
