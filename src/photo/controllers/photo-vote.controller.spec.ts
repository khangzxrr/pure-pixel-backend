import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoVoteRequestDto } from '../dtos/rest/photo-vote.request.dto';
import { PhotoVoteService } from '../services/photo-vote.service';
import { PhotoVoteController } from './photo-vote.controller';

describe('PhotoVoteController', () => {
  const user = { sub: 'user-1' } as ParsedUserDto;
  let photoVoteService: {
    vote: jest.Mock;
    getVote: jest.Mock;
    deleteVote: jest.Mock;
  };
  let controller: PhotoVoteController;

  beforeEach(() => {
    photoVoteService = {
      vote: jest.fn().mockResolvedValue('voted'),
      getVote: jest.fn().mockResolvedValue('vote'),
      deleteVote: jest.fn().mockResolvedValue('deleted'),
    };
    controller = new PhotoVoteController(
      photoVoteService as unknown as PhotoVoteService,
    );
  });

  it('votes a photo', async () => {
    const dto = { isUpvote: true } as PhotoVoteRequestDto;

    await expect(controller.upvoteAnPhoto(user, 'p1', dto)).resolves.toBe(
      'voted',
    );
    expect(photoVoteService.vote).toHaveBeenCalledWith('user-1', 'p1', dto);
  });

  it('checks a vote', async () => {
    await expect(controller.checkVote(user, 'p1')).resolves.toBe('vote');
    expect(photoVoteService.getVote).toHaveBeenCalledWith('user-1', 'p1');
  });

  it('deletes a vote', async () => {
    await expect(controller.deletePhotoById(user, 'p1')).resolves.toBe(
      'deleted',
    );
    expect(photoVoteService.deleteVote).toHaveBeenCalledWith('user-1', 'p1');
  });
});
