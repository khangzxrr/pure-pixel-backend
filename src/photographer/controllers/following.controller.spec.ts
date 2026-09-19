import { FindAllFollowRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';
import { FollowingService } from '../services/following.service';
import { FollowingController } from './following.controller';

describe('FollowingController', () => {
  const user = { sub: 'me' };
  const dto = new FindAllFollowRequestDto();
  let followingService: {
    get: jest.Mock;
    unfollow: jest.Mock;
    follow: jest.Mock;
    getAllFollowerOfUserId: jest.Mock;
    getAllFollowedByUserId: jest.Mock;
  };
  let controller: FollowingController;

  beforeEach(() => {
    followingService = {
      get: jest.fn().mockResolvedValue('get'),
      unfollow: jest.fn().mockResolvedValue('unfollow'),
      follow: jest.fn().mockResolvedValue('follow'),
      getAllFollowerOfUserId: jest.fn().mockResolvedValue('followers'),
      getAllFollowedByUserId: jest.fn().mockResolvedValue('followings'),
    };
    controller = new FollowingController(
      followingService as unknown as FollowingService,
    );
  });

  it('checkFollow gets the follow between me and the user', async () => {
    await expect(controller.checkFollow(user, 'u2')).resolves.toBe('get');
    expect(followingService.get).toHaveBeenCalledWith('me', 'u2');
  });

  it('unfollow unfollows the user', async () => {
    await expect(controller.unfollow(user, 'u2')).resolves.toBe('unfollow');
    expect(followingService.unfollow).toHaveBeenCalledWith('me', 'u2');
  });

  it('follow follows the user', async () => {
    await expect(controller.follow(user, 'u2')).resolves.toBe('follow');
    expect(followingService.follow).toHaveBeenCalledWith('me', 'u2');
  });

  it('findallFollower lists my followers', async () => {
    await expect(controller.findallFollower(user, dto)).resolves.toBe(
      'followers',
    );
    expect(followingService.getAllFollowerOfUserId).toHaveBeenCalledWith(
      'me',
      dto,
    );
  });

  it('findAllFollowing lists users I follow', async () => {
    await expect(controller.findAllFollowing(user, dto)).resolves.toBe(
      'followings',
    );
    expect(followingService.getAllFollowedByUserId).toHaveBeenCalledWith(
      'me',
      dto,
    );
  });

  it('findallFollowerOfUserId lists followers of the user', async () => {
    await expect(controller.findallFollowerOfUserId('u2', dto)).resolves.toBe(
      'followers',
    );
    expect(followingService.getAllFollowerOfUserId).toHaveBeenCalledWith(
      'u2',
      dto,
    );
  });

  it('findAllFollowingOfUserId lists users followed by the user', async () => {
    await expect(controller.findAllFollowingOfUserId('u2', dto)).resolves.toBe(
      'followings',
    );
    expect(followingService.getAllFollowedByUserId).toHaveBeenCalledWith(
      'u2',
      dto,
    );
  });
});
