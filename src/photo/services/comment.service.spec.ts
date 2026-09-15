import { Queue } from 'bullmq';
import { CommentRepository } from 'src/database/repositories/comment.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { CommentDto } from '../dtos/comment-dto';
import { CommentEntity } from '../entities/comment.entity';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let commentRepository: Record<
    | 'findAllParentCommentByPhotoId'
    | 'findReplyByCommentId'
    | 'findUniqueOrThrow'
    | 'deleteMany'
    | 'delete'
    | 'update'
    | 'createComment',
    jest.Mock
  >;
  let photoRepository: Record<'findUniqueOrThrow', jest.Mock>;
  let notificationQueue: Record<'add', jest.Mock>;
  let service: CommentService;

  const photo = {
    id: 'p1',
    title: 'Sunset',
    photographerId: 'owner',
    visibility: 'PUBLIC',
  };

  beforeEach(() => {
    commentRepository = {
      findAllParentCommentByPhotoId: jest
        .fn()
        .mockResolvedValue([{ id: 'c1', content: 'hi' }]),
      findReplyByCommentId: jest
        .fn()
        .mockResolvedValue([{ id: 'c2', content: 'reply' }]),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ id: 'c1', userId: 'parent-user' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 'c1' }),
      update: jest.fn().mockResolvedValue({ id: 'c1', content: 'edited' }),
      createComment: jest.fn().mockResolvedValue({ id: 'new', content: 'x' }),
    };
    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue(photo),
    };
    notificationQueue = { add: jest.fn().mockResolvedValue({}) };

    service = new CommentService(
      commentRepository as unknown as CommentRepository,
      photoRepository as unknown as PhotoRepository,
      notificationQueue as unknown as Queue,
    );
  });

  describe('validatePhotoByIdAndVisibility', () => {
    it('throws when photo is not found', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(null);

      await expect(
        service.validatePhotoByIdAndVisibility('p1', 'u1'),
      ).rejects.toBeInstanceOf(PhotoNotFoundException);
    });

    it('throws when photo is private and user is not the owner', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        ...photo,
        visibility: 'PRIVATE',
      });

      await expect(
        service.validatePhotoByIdAndVisibility('p1', 'u1'),
      ).rejects.toBeInstanceOf(PhotoIsPrivatedException);
    });

    it('returns private photo for its owner', async () => {
      const privatePhoto = { ...photo, visibility: 'PRIVATE' };
      photoRepository.findUniqueOrThrow.mockResolvedValue(privatePhoto);

      await expect(
        service.validatePhotoByIdAndVisibility('p1', 'owner'),
      ).resolves.toBe(privatePhoto);
    });

    it('returns public photo for anyone', async () => {
      await expect(
        service.validatePhotoByIdAndVisibility('p1', 'u1'),
      ).resolves.toBe(photo);
    });
  });

  it('finds all parent comments of a photo', async () => {
    const result = await service.findAllByPhotoId('p1', 'u1');

    expect(
      commentRepository.findAllParentCommentByPhotoId,
    ).toHaveBeenCalledWith('p1');
    expect(result[0]).toBeInstanceOf(CommentDto);
  });

  it('finds all replies of a comment', async () => {
    const result = await service.findAllReplies('p1', 'u1', 'c1');

    expect(commentRepository.findReplyByCommentId).toHaveBeenCalledWith('c1');
    expect(result[0]).toBeInstanceOf(CommentDto);
  });

  it('deletes a comment and its replies', async () => {
    const result = await service.deleteComment('p1', 'u1', 'c1');

    expect(commentRepository.findUniqueOrThrow).toHaveBeenCalledWith({
      photoId: 'p1',
      userId: 'u1',
      id: 'c1',
    });
    expect(commentRepository.deleteMany).toHaveBeenCalledWith({
      parentId: 'c1',
    });
    expect(commentRepository.delete).toHaveBeenCalledWith({
      photoId: 'p1',
      userId: 'u1',
      id: 'c1',
    });
    expect(result).toBeInstanceOf(CommentDto);
  });

  it('updates a comment content', async () => {
    const result = await service.updateComment('p1', 'u1', 'c1', {
      content: 'edited',
    });

    expect(commentRepository.update).toHaveBeenCalledWith({
      data: { content: 'edited' },
      where: { id: 'c1' },
    });
    expect(result).toBeInstanceOf(CommentDto);
  });

  it('creates a reply and notifies photographer and parent commenter', async () => {
    const result = await service.createReply('p1', 'u1', 'c1', {
      content: 'reply',
    });

    expect(commentRepository.findUniqueOrThrow).toHaveBeenCalledWith({
      id: 'c1',
      photoId: 'p1',
    });
    expect(notificationQueue.add).toHaveBeenCalledTimes(2);
    expect(notificationQueue.add).toHaveBeenNthCalledWith(
      1,
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      expect.objectContaining({
        userId: 'owner',
        referenceType: 'PHOTO_COMMENT',
        payload: { id: 'p1' },
      }),
    );
    expect(notificationQueue.add).toHaveBeenNthCalledWith(
      2,
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      expect.objectContaining({ userId: 'parent-user' }),
    );
    const created: CommentEntity =
      commentRepository.createComment.mock.calls[0][0];
    expect(created).toBeInstanceOf(CommentEntity);
    expect(created).toMatchObject({
      content: 'reply',
      userId: 'u1',
      photoId: 'p1',
      parentId: 'c1',
    });
    expect(result).toBeInstanceOf(CommentDto);
  });

  it('creates a comment and notifies photographer', async () => {
    const result = await service.createComment('p1', 'u1', { content: 'x' });

    expect(notificationQueue.add).toHaveBeenCalledWith(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      expect.objectContaining({ userId: 'owner', type: 'IN_APP' }),
    );
    expect(commentRepository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'x', userId: 'u1', photoId: 'p1' }),
    );
    expect(result).toBeInstanceOf(CommentDto);
  });

  it('allows the owner to comment on their private photo', async () => {
    photoRepository.findUniqueOrThrow.mockResolvedValue({
      ...photo,
      visibility: 'PRIVATE',
    });

    const result = await service.createComment('p1', 'owner', {
      content: 'mine',
    });

    expect(commentRepository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'mine',
        userId: 'owner',
        photoId: 'p1',
      }),
    );
    expect(result).toBeInstanceOf(CommentDto);
  });

  it('forbids a non-owner from commenting on a private photo', async () => {
    photoRepository.findUniqueOrThrow.mockResolvedValue({
      ...photo,
      visibility: 'PRIVATE',
    });

    await expect(
      service.createComment('p1', 'u1', { content: 'x' }),
    ).rejects.toBeInstanceOf(PhotoIsPrivatedException);
    expect(commentRepository.createComment).not.toHaveBeenCalled();
    expect(notificationQueue.add).not.toHaveBeenCalled();
  });
});
