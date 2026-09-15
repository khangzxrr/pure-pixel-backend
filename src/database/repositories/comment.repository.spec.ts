import { Comment } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CommentRepository } from './comment.repository';

describe('CommentRepository', () => {
  const comment = {
    findUniqueOrThrow: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
  const extendedComment = { deleteMany: jest.fn() };
  const prisma = {
    comment,
    extendedClient: jest.fn(() => ({ comment: extendedComment })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  const replyInclude = {
    user: true,
    replies: {
      select: {
        id: true,
        user: true,
        createdAt: true,
        updatedAt: true,
        content: true,
        _count: { select: { replies: true } },
      },
    },
  };
  let repository: CommentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    [...Object.values(comment), extendedComment.deleteMany].forEach((fn) =>
      fn.mockReturnValue(result),
    );
    repository = new CommentRepository(prisma);
  });

  it('findUniqueOrThrow should find with where', async () => {
    expect(await repository.findUniqueOrThrow({ id: 'c' })).toBe(result);
    expect(comment.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'c' },
    });
  });

  it('deleteMany should use the extended client', async () => {
    expect(await repository.deleteMany({ photoId: 'p' })).toBe(result);
    expect(extendedComment.deleteMany).toHaveBeenCalledWith({
      where: { photoId: 'p' },
    });
  });

  it('delete should delete with where', async () => {
    expect(await repository.delete({ id: 'c' })).toBe(result);
    expect(comment.delete).toHaveBeenCalledWith({ where: { id: 'c' } });
  });

  it('update should forward args', async () => {
    const args = { where: { id: 'c' }, data: { content: 'x' } };

    expect(await repository.update(args)).toBe(result);
    expect(comment.update).toHaveBeenCalledWith(args);
  });

  it('findReplyByCommentId should find replies with counts', async () => {
    expect(await repository.findReplyByCommentId('c')).toBe(result);
    expect(comment.findMany).toHaveBeenCalledWith({
      where: { parentId: 'c' },
      include: replyInclude,
    });
  });

  it('findAllParentCommentByPhotoId should find root comments', async () => {
    expect(await repository.findAllParentCommentByPhotoId('p')).toBe(result);
    expect(comment.findMany).toHaveBeenCalledWith({
      where: { photoId: 'p', parentId: null },
      include: replyInclude,
    });
  });

  it('createComment should create with data', async () => {
    const data = { id: 'c', content: 'hello' } as unknown as Comment;

    expect(await repository.createComment(data)).toBe(result);
    expect(comment.create).toHaveBeenCalledWith({ data });
  });
});
