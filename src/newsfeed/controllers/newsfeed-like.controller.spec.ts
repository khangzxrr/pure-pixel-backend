import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NewsfeedLikeService } from '../services/newsfeed-like.service';
import { NewsfeedLikeController } from './newsfeed-like.controller';

describe('NewsfeedLikeController', () => {
  let newsfeedLikeService: jest.Mocked<
    Pick<NewsfeedLikeService, 'findUnique' | 'upsert' | 'delete'>
  >;
  let controller: NewsfeedLikeController;

  const user = { sub: 'u1' } as unknown as ParsedUserDto;
  const like = { id: 'l1' };

  beforeEach(() => {
    newsfeedLikeService = {
      findUnique: jest.fn().mockResolvedValue(like),
      upsert: jest.fn().mockResolvedValue(like),
      delete: jest.fn().mockResolvedValue(like),
    };

    controller = new NewsfeedLikeController(
      newsfeedLikeService as unknown as NewsfeedLikeService,
    );
  });

  it('should check whether user liked newsfeed', async () => {
    await expect(controller.findUnique(user, 'n1')).resolves.toBe(like);
    expect(newsfeedLikeService.findUnique).toHaveBeenCalledWith('u1', 'n1');
  });

  it('should like newsfeed', async () => {
    await expect(controller.create(user, 'n1')).resolves.toBe(like);
    expect(newsfeedLikeService.upsert).toHaveBeenCalledWith('u1', 'n1');
  });

  it('should unlike newsfeed', async () => {
    await expect(controller.delete(user, 'n1')).resolves.toBe(like);
    expect(newsfeedLikeService.delete).toHaveBeenCalledWith('u1', 'n1');
  });
});
