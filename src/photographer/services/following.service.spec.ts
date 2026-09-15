import { FollowRepository } from 'src/database/repositories/follow.repository';
import { FindAllFollowRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';
import { FindAllFollowResponseDto } from '../dtos/find-all-following-dtos/find-all-following.response.dto';
import { FollowDto } from '../dtos/following-dto';
import { FollowerFollowingCannotBeSameException } from '../exceptions/follower-following-cannot-be-same.exception';
import { FollowingService } from './following.service';

describe('FollowingService', () => {
  let followRepository: {
    delete: jest.Mock;
    upsert: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    findAll: jest.Mock;
  };
  let service: FollowingService;

  const findAllDto = () =>
    Object.assign(new FindAllFollowRequestDto(), { limit: 10, page: 2 });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    followRepository = {
      delete: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
    };
    service = new FollowingService(
      followRepository as unknown as FollowRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('unfollow', () => {
    it('throws when following yourself', async () => {
      await expect(service.unfollow('u1', 'u1')).rejects.toBeInstanceOf(
        FollowerFollowingCannotBeSameException,
      );
      expect(followRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the follow and returns it as dto', async () => {
      followRepository.delete.mockResolvedValue({
        followerId: 'u1',
        followingId: 'u2',
      });

      const result = await service.unfollow('u1', 'u2');

      expect(result).toBeInstanceOf(FollowDto);
      expect(result).toEqual(
        expect.objectContaining({ followerId: 'u1', followingId: 'u2' }),
      );
      expect(followRepository.delete).toHaveBeenCalledWith({
        followerId_followingId: { followerId: 'u1', followingId: 'u2' },
      });
    });
  });

  describe('follow', () => {
    it('throws when following yourself', async () => {
      await expect(service.follow('u1', 'u1')).rejects.toBeInstanceOf(
        FollowerFollowingCannotBeSameException,
      );
      expect(followRepository.upsert).not.toHaveBeenCalled();
    });

    it('upserts the follow connecting both users', async () => {
      followRepository.upsert.mockResolvedValue({
        followerId: 'u1',
        followingId: 'u2',
      });

      const result = await service.follow('u1', 'u2');

      expect(result).toBeInstanceOf(FollowDto);
      expect(followRepository.upsert).toHaveBeenCalledWith(
        { followerId_followingId: { followerId: 'u1', followingId: 'u2' } },
        {
          follower: { connect: { id: 'u1' } },
          following: { connect: { id: 'u2' } },
        },
      );
    });
  });

  it('get returns the follow with both users', async () => {
    followRepository.findUnique.mockResolvedValue({
      follower: { id: 'u1' },
      following: { id: 'u2' },
    });

    const result = await service.get('u1', 'u2');

    expect(result).toBeInstanceOf(FollowDto);
    expect(result.following).toEqual(expect.objectContaining({ id: 'u2' }));
    expect(followRepository.findUnique).toHaveBeenCalledWith(
      { followerId_followingId: { followingId: 'u2', followerId: 'u1' } },
      { following: true, follower: true },
    );
  });

  it('getAllFollowerOfUserId pages the followers of the user', async () => {
    followRepository.count.mockResolvedValue(25);
    followRepository.findAll.mockResolvedValue([
      { follower: { id: 'a' } },
      { follower: { id: 'b' } },
    ]);

    const result = await service.getAllFollowerOfUserId('u1', findAllDto());

    expect(followRepository.count).toHaveBeenCalledWith({ followingId: 'u1' });
    expect(followRepository.findAll).toHaveBeenCalledWith(
      { followingId: 'u1' },
      { follower: true },
      20,
      10,
    );
    expect(result).toBeInstanceOf(FindAllFollowResponseDto);
    expect(result.totalRecord).toBe(25);
    expect(result.totalPage).toBe(3);
    expect(result.objects).toHaveLength(2);
    expect(result.objects[0]).toBeInstanceOf(FollowDto);
  });

  it('getAllFollowedByUserId pages the users followed by the user', async () => {
    followRepository.count.mockResolvedValue(1);
    followRepository.findAll.mockResolvedValue([{ following: { id: 'x' } }]);

    const result = await service.getAllFollowedByUserId('u1', findAllDto());

    expect(followRepository.count).toHaveBeenCalledWith({ followerId: 'u1' });
    expect(followRepository.findAll).toHaveBeenCalledWith(
      { followerId: 'u1' },
      { following: true },
      20,
      10,
    );
    expect(result.totalRecord).toBe(1);
    expect(result.totalPage).toBe(1);
    expect(result.objects[0]).toBeInstanceOf(FollowDto);
  });
});
