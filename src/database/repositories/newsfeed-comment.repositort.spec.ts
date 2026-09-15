import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { NewsfeedCommentRepository } from './newsfeed-comment.repositort';

describe('NewsfeedCommentRepository', () => {
  const newsfeedComment = {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  const prisma = {
    extendedClient: jest.fn(() => ({ newsfeedComment })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: NewsfeedCommentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(newsfeedComment).forEach((fn) => fn.mockReturnValue(result));
    repository = new NewsfeedCommentRepository(prisma);
  });

  it('create should create with data', () => {
    const data = {
      content: 'hi',
    } as unknown as Prisma.NewsfeedCommentCreateInput;

    expect(repository.create(data)).toBe(result);
    expect(newsfeedComment.create).toHaveBeenCalledWith({ data });
  });

  it('findMany should page with include', () => {
    expect(repository.findMany({ newsfeedId: 'n' }, { user: true }, 3, 4)).toBe(
      result,
    );
    expect(newsfeedComment.findMany).toHaveBeenCalledWith({
      where: { newsfeedId: 'n' },
      skip: 3,
      take: 4,
      include: { user: true },
    });
  });

  it('delete should delete with where', () => {
    expect(repository.delete({ id: 'c' })).toBe(result);
    expect(newsfeedComment.delete).toHaveBeenCalledWith({ where: { id: 'c' } });
  });

  it('update should update with where and data', () => {
    expect(repository.update({ id: 'c' }, { content: 'x' })).toBe(result);
    expect(newsfeedComment.update).toHaveBeenCalledWith({
      where: { id: 'c' },
      data: { content: 'x' },
    });
  });
});
