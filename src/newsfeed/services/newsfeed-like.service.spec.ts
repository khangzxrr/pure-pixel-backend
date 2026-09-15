import { NewsfeedLikeRepository } from 'src/database/repositories/newsfeed-like.repository';
import { InsufficientPermissionToPerformOnNewsfeedException } from '../exceptions/insufficient-permission-to-perform-on-newsfeed.exception';
import { NewsfeedLikeService } from './newsfeed-like.service';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedLikeService', () => {
  let newsfeedService: jest.Mocked<Pick<NewsfeedService, 'validatePermission'>>;
  let newsfeedLikeRepository: jest.Mocked<
    Pick<NewsfeedLikeRepository, 'findUnique' | 'upsert' | 'delete'>
  >;
  let service: NewsfeedLikeService;

  const like = { id: 'l1', userId: 'u1', newsfeedId: 'n1' };
  const key = { newsfeedId_userId: { newsfeedId: 'n1', userId: 'u1' } };

  beforeEach(() => {
    newsfeedService = {
      validatePermission: jest.fn().mockResolvedValue(undefined),
    };
    newsfeedLikeRepository = {
      findUnique: jest.fn().mockResolvedValue(like),
      upsert: jest.fn().mockResolvedValue(like),
      delete: jest.fn().mockResolvedValue(like),
    };

    service = new NewsfeedLikeService(
      newsfeedService as unknown as NewsfeedService,
      newsfeedLikeRepository as unknown as NewsfeedLikeRepository,
    );
  });

  it('should find like of user', async () => {
    await expect(service.findUnique('u1', 'n1')).resolves.toBe(like);
    expect(newsfeedLikeRepository.findUnique).toHaveBeenCalledWith(key);
    expect(newsfeedService.validatePermission).not.toHaveBeenCalled();
  });

  it('should upsert like after permission check', async () => {
    await expect(service.upsert('u1', 'n1')).resolves.toBe(like);
    expect(newsfeedService.validatePermission).toHaveBeenCalledWith('u1', 'n1');
    expect(newsfeedLikeRepository.upsert).toHaveBeenCalledWith(
      key,
      {},
      {
        user: { connect: { id: 'u1' } },
        newsfeed: { connect: { id: 'n1' } },
      },
    );
  });

  it('should delete like after permission check', async () => {
    await expect(service.delete('u1', 'n1')).resolves.toBe(like);
    expect(newsfeedLikeRepository.delete).toHaveBeenCalledWith(key);
  });

  it('should not upsert when permission is denied', async () => {
    newsfeedService.validatePermission.mockRejectedValue(
      new InsufficientPermissionToPerformOnNewsfeedException(),
    );

    await expect(service.upsert('u1', 'n1')).rejects.toBeInstanceOf(
      InsufficientPermissionToPerformOnNewsfeedException,
    );
    expect(newsfeedLikeRepository.upsert).not.toHaveBeenCalled();
  });
});
