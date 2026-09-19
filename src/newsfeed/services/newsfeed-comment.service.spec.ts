import { NewsfeedCommentRepository } from 'src/database/repositories/newsfeed-comment.repositort';
import { NewsfeedCommentDto } from '../dtos/newsfeed-comment.dto';
import { NewsfeedCommentFindAllDto } from '../dtos/rest/newsfeed-comment-find-all.request.dto';
import { InsufficientPermissionToPerformOnNewsfeedException } from '../exceptions/insufficient-permission-to-perform-on-newsfeed.exception';
import { NewsfeedCommentService } from './newsfeed-comment.service';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedCommentService', () => {
  let newsfeedCommentRepository: jest.Mocked<
    Pick<NewsfeedCommentRepository, 'update' | 'create' | 'delete' | 'findMany'>
  >;
  let newsfeedService: jest.Mocked<Pick<NewsfeedService, 'validatePermission'>>;
  let service: NewsfeedCommentService;

  const comment = { id: 'c1', content: 'hi', userId: 'u1', newsfeedId: 'n1' };

  beforeEach(() => {
    newsfeedCommentRepository = {
      update: jest.fn().mockResolvedValue(comment),
      create: jest.fn().mockResolvedValue(comment),
      delete: jest.fn().mockResolvedValue(comment),
      findMany: jest.fn().mockResolvedValue([comment]),
    };
    newsfeedService = {
      validatePermission: jest.fn().mockResolvedValue(undefined),
    };

    service = new NewsfeedCommentService(
      newsfeedCommentRepository as unknown as NewsfeedCommentRepository,
      newsfeedService as unknown as NewsfeedService,
    );
  });

  it('should update own comment', async () => {
    const result = await service.update('u1', 'n1', 'c1', { content: 'new' });

    expect(newsfeedService.validatePermission).toHaveBeenCalledWith('u1', 'n1');
    expect(newsfeedCommentRepository.update).toHaveBeenCalledWith(
      { userId: 'u1', id: 'c1', newsfeedId: 'n1' },
      { content: 'new' },
    );
    expect(result).toBeInstanceOf(NewsfeedCommentDto);
  });

  it('should create comment', async () => {
    const result = await service.create('u1', 'n1', { content: 'hi' });

    expect(newsfeedCommentRepository.create).toHaveBeenCalledWith({
      newsfeed: { connect: { id: 'n1' } },
      user: { connect: { id: 'u1' } },
      content: 'hi',
    });
    expect(result).toBeInstanceOf(NewsfeedCommentDto);
  });

  it('should reply to comment', async () => {
    const result = await service.reply('u1', 'n1', 'c0', { content: 'hi' });

    expect(newsfeedCommentRepository.create).toHaveBeenCalledWith({
      newsfeed: { connect: { id: 'n1' } },
      user: { connect: { id: 'u1' } },
      parent: { connect: { id: 'c0' } },
      content: 'hi',
    });
    expect(result).toBeInstanceOf(NewsfeedCommentDto);
  });

  it('should delete own comment', async () => {
    const result = await service.delete('u1', 'n1', 'c1');

    expect(newsfeedCommentRepository.delete).toHaveBeenCalledWith({
      userId: 'u1',
      id: 'c1',
      newsfeedId: 'n1',
    });
    expect(result).toBeInstanceOf(NewsfeedCommentDto);
  });

  it('should find comments with paging and parent filter', async () => {
    const dto = Object.assign(new NewsfeedCommentFindAllDto(), {
      limit: 5,
      page: 2,
    });

    const result = await service.findMany('u1', 'n1', dto, 'c0');

    expect(newsfeedCommentRepository.findMany).toHaveBeenCalledWith(
      { newsfeedId: 'n1', parentId: 'c0' },
      expect.objectContaining({ user: true }),
      10,
      5,
    );
    expect(result[0]).toBeInstanceOf(NewsfeedCommentDto);
  });

  it('should find top level comments when parent is not provided', async () => {
    const dto = Object.assign(new NewsfeedCommentFindAllDto(), {
      limit: 5,
      page: 0,
    });

    await service.findMany('u1', 'n1', dto);

    expect(newsfeedCommentRepository.findMany).toHaveBeenCalledWith(
      { newsfeedId: 'n1', parentId: undefined },
      expect.anything(),
      0,
      5,
    );
  });

  it('should not touch repository when permission is denied', async () => {
    newsfeedService.validatePermission.mockRejectedValue(
      new InsufficientPermissionToPerformOnNewsfeedException(),
    );

    await expect(
      service.create('u1', 'n1', { content: 'x' }),
    ).rejects.toBeInstanceOf(
      InsufficientPermissionToPerformOnNewsfeedException,
    );
    expect(newsfeedCommentRepository.create).not.toHaveBeenCalled();
  });
});
