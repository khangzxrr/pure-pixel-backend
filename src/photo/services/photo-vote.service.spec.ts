import { Queue } from 'bullmq';
import { PhotoVoteRepository } from 'src/database/repositories/photo-vote.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoVoteDto } from '../dtos/photo-vote.dto';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoVoteService } from './photo-vote.service';

type Photo = Awaited<ReturnType<PhotoRepository['findUniqueOrThrow']>>;
type Vote = Awaited<ReturnType<PhotoVoteRepository['vote']>>;
type ExistVote = Awaited<ReturnType<PhotoVoteRepository['findFirst']>>;
type DeletedVote = Awaited<ReturnType<PhotoVoteRepository['delete']>>;

describe('PhotoVoteService', () => {
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findUniqueOrThrow'>>;
  let photoVoteRepository: jest.Mocked<
    Pick<PhotoVoteRepository, 'findFirst' | 'vote' | 'delete'>
  >;
  let service: PhotoVoteService;

  const vote = {
    photoId: 'p1',
    userId: 'u1',
    isUpvote: true,
  } as unknown as Vote;

  beforeEach(() => {
    photoRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'p1' } as Photo),
    };
    photoVoteRepository = {
      findFirst: jest.fn().mockResolvedValue(vote as unknown as ExistVote),
      vote: jest.fn().mockResolvedValue(vote),
      delete: jest.fn().mockResolvedValue(vote as unknown as DeletedVote),
    };

    service = new PhotoVoteService(
      photoRepository as unknown as PhotoRepository,
      photoVoteRepository as unknown as PhotoVoteRepository,
      {} as Queue,
    );
  });

  it('returns the vote of a user', async () => {
    const result = await service.getVote('u1', 'p1');

    expect(result).toBeInstanceOf(PhotoVoteDto);
    expect(photoVoteRepository.findFirst).toHaveBeenCalledWith('u1', 'p1');
  });

  it('votes an existing photo', async () => {
    const result = await service.vote('u1', 'p1', { isUpvote: false });

    expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p1');
    expect(photoVoteRepository.vote).toHaveBeenCalledWith('u1', false, 'p1');
    expect(result).toBeInstanceOf(PhotoVoteDto);
  });

  it('returns undefined when there is no vote to delete', async () => {
    photoVoteRepository.findFirst.mockResolvedValue(null);

    await expect(service.deleteVote('u1', 'p1')).resolves.toBeUndefined();
    expect(photoVoteRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes an existing vote', async () => {
    const result = await service.deleteVote('u1', 'p1');

    expect(photoVoteRepository.delete).toHaveBeenCalledWith('p1', 'u1');
    expect(result).toBeInstanceOf(PhotoDto);
  });
});
