import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CommentService } from '../services/comment.service';
import { PhotoCommentController } from './photo-comment.controller';

describe('PhotoCommentController', () => {
  const user = { sub: 'u1' } as ParsedUserDto;
  let commentService: Record<
    | 'findAllByPhotoId'
    | 'findAllReplies'
    | 'createReply'
    | 'updateComment'
    | 'deleteComment'
    | 'createComment',
    jest.Mock
  >;
  let controller: PhotoCommentController;

  beforeEach(() => {
    commentService = {
      findAllByPhotoId: jest.fn().mockResolvedValue(['comment']),
      findAllReplies: jest.fn().mockResolvedValue(['reply']),
      createReply: jest.fn().mockResolvedValue('created-reply'),
      updateComment: jest.fn().mockResolvedValue('updated'),
      deleteComment: jest.fn().mockResolvedValue('deleted'),
      createComment: jest.fn().mockResolvedValue('created'),
    };
    controller = new PhotoCommentController(
      commentService as unknown as CommentService,
    );
  });

  describe('getComments', () => {
    it('uses user id when authenticated', async () => {
      await expect(controller.getComments(user, 'p1')).resolves.toEqual([
        'comment',
      ]);
      expect(commentService.findAllByPhotoId).toHaveBeenCalledWith('p1', 'u1');
    });

    it('uses empty user id when anonymous', async () => {
      await controller.getComments(undefined as unknown as ParsedUserDto, 'p1');
      expect(commentService.findAllByPhotoId).toHaveBeenCalledWith('p1', '');
    });
  });

  describe('getCommentReply', () => {
    it('uses user id when authenticated', async () => {
      await expect(
        controller.getCommentReply(user, 'p1', 'c1'),
      ).resolves.toEqual(['reply']);
      expect(commentService.findAllReplies).toHaveBeenCalledWith(
        'p1',
        'u1',
        'c1',
      );
    });

    it('uses empty user id when anonymous', async () => {
      await controller.getCommentReply(
        undefined as unknown as ParsedUserDto,
        'p1',
        'c1',
      );
      expect(commentService.findAllReplies).toHaveBeenCalledWith(
        'p1',
        '',
        'c1',
      );
    });
  });

  it('creates a reply', async () => {
    const dto = { content: 'hi' };

    await expect(controller.createReply(user, 'p1', 'c1', dto)).resolves.toBe(
      'created-reply',
    );
    expect(commentService.createReply).toHaveBeenCalledWith(
      'p1',
      'u1',
      'c1',
      dto,
    );
  });

  it('updates a comment', async () => {
    const dto = { content: 'edit' };

    await expect(controller.updateComment(user, 'p1', 'c1', dto)).resolves.toBe(
      'updated',
    );
    expect(commentService.updateComment).toHaveBeenCalledWith(
      'p1',
      'u1',
      'c1',
      dto,
    );
  });

  it('deletes a comment', async () => {
    await expect(controller.deleteComment(user, 'p1', 'c1')).resolves.toBe(
      'deleted',
    );
    expect(commentService.deleteComment).toHaveBeenCalledWith('p1', 'u1', 'c1');
  });

  it('creates a comment', async () => {
    const dto = { content: 'new' };

    await expect(controller.createComment(user, 'p1', dto)).resolves.toBe(
      'created',
    );
    expect(commentService.createComment).toHaveBeenCalledWith('p1', 'u1', dto);
  });
});
