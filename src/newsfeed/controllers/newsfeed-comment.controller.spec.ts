import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NewsfeedCommentFindAllDto } from '../dtos/rest/newsfeed-comment-find-all.request.dto';
import { NewsfeedCommentService } from '../services/newsfeed-comment.service';
import { NewsfeedCommentController } from './newsfeed-comment.controller';

describe('NewsfeedCommentController', () => {
  let newsfeedCommentService: jest.Mocked<
    Pick<
      NewsfeedCommentService,
      'findMany' | 'create' | 'reply' | 'update' | 'delete'
    >
  >;
  let controller: NewsfeedCommentController;

  const user = { sub: 'u1' } as unknown as ParsedUserDto;
  const anonymous = undefined as unknown as ParsedUserDto;
  const findAllDto = Object.assign(new NewsfeedCommentFindAllDto(), {
    limit: 5,
    page: 0,
  });
  const comment = { id: 'c1' };

  beforeEach(() => {
    newsfeedCommentService = {
      findMany: jest.fn().mockResolvedValue([comment]),
      create: jest.fn().mockResolvedValue(comment),
      reply: jest.fn().mockResolvedValue(comment),
      update: jest.fn().mockResolvedValue(comment),
      delete: jest.fn().mockResolvedValue(comment),
    };

    controller = new NewsfeedCommentController(
      newsfeedCommentService as unknown as NewsfeedCommentService,
    );
  });

  it('should find comments for authenticated user', async () => {
    await expect(controller.findAll(user, 'n1', findAllDto)).resolves.toEqual([
      comment,
    ]);
    expect(newsfeedCommentService.findMany).toHaveBeenCalledWith(
      'u1',
      'n1',
      findAllDto,
    );
  });

  it('should find comments for anonymous user', async () => {
    await controller.findAll(anonymous, 'n1', findAllDto);

    expect(newsfeedCommentService.findMany).toHaveBeenCalledWith(
      '',
      'n1',
      findAllDto,
    );
  });

  it('should find replies for authenticated user', async () => {
    await controller.findAllReplies(user, 'n1', 'c0', findAllDto);

    expect(newsfeedCommentService.findMany).toHaveBeenCalledWith(
      'u1',
      'n1',
      findAllDto,
      'c0',
    );
  });

  it('should find replies for anonymous user', async () => {
    await controller.findAllReplies(anonymous, 'n1', 'c0', findAllDto);

    expect(newsfeedCommentService.findMany).toHaveBeenCalledWith(
      '',
      'n1',
      findAllDto,
      'c0',
    );
  });

  it('should create comment', async () => {
    await expect(
      controller.create(user, 'n1', { content: 'hi' }),
    ).resolves.toBe(comment);
    expect(newsfeedCommentService.create).toHaveBeenCalledWith('u1', 'n1', {
      content: 'hi',
    });
  });

  it('should create reply', async () => {
    await expect(
      controller.createReply(user, 'n1', 'c0', { content: 'hi' }),
    ).resolves.toBe(comment);
    expect(newsfeedCommentService.reply).toHaveBeenCalledWith(
      'u1',
      'n1',
      'c0',
      { content: 'hi' },
    );
  });

  it('should update comment', async () => {
    await expect(
      controller.update(user, 'n1', 'c1', { content: 'edit' }),
    ).resolves.toBe(comment);
    expect(newsfeedCommentService.update).toHaveBeenCalledWith(
      'u1',
      'n1',
      'c1',
      { content: 'edit' },
    );
  });

  it('should delete comment', async () => {
    await expect(controller.delete(user, 'n1', 'c1')).resolves.toBe(comment);
    expect(newsfeedCommentService.delete).toHaveBeenCalledWith(
      'u1',
      'n1',
      'c1',
    );
  });
});
