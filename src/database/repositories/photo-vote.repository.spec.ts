import { PrismaService } from 'src/prisma.service';
import { PhotoVoteRepository } from './photo-vote.repository';

describe('PhotoVoteRepository', () => {
  const vote = {
    aggregate: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  };
  const repository = new PhotoVoteRepository({
    vote,
  } as unknown as PrismaService);
  const result = { id: 'result' };
  const where = { userId_photoId: { userId: 'u', photoId: 'p' } };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(vote).forEach((fn) => fn.mockReturnValue(result));
  });

  it('aggregate should count votes with where', () => {
    expect(repository.aggregate({ photoId: 'p' })).toBe(result);
    expect(vote.aggregate).toHaveBeenCalledWith({
      where: { photoId: 'p' },
      _count: { id: true },
    });
  });

  it('delete should delete by user and photo', () => {
    expect(repository.delete('p', 'u')).toBe(result);
    expect(vote.delete).toHaveBeenCalledWith({ where });
  });

  it('findFirst should find by user and photo', () => {
    expect(repository.findFirst('u', 'p')).toBe(result);
    expect(vote.findUnique).toHaveBeenCalledWith({ where });
  });

  it('vote should upsert the vote', () => {
    expect(repository.vote('u', true, 'p')).toBe(result);
    expect(vote.upsert).toHaveBeenCalledWith({
      where,
      update: { isUpvote: true },
      create: {
        photo: { connect: { id: 'p' } },
        user: { connect: { id: 'u' } },
        isUpvote: true,
      },
    });
  });
});
