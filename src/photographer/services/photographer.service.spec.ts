import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { FindAllPhotographerResponseDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.response.dto';
import { PhotographerProfileDto } from '../dtos/photographer-profile.dto';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { PhotographerNotFoundException } from '../exceptions/photographer-not-found.exception';
import { FollowingService } from './following.service';
import { PhotographerService } from './photographer.service';

describe('PhotographerService', () => {
  let photoService: {
    findAllWithUpvoteAndCommentCountByUserId: jest.Mock;
    findAll: jest.Mock;
  };
  let keycloakService: { findUsersHasRole: jest.Mock };
  let userRepository: {
    rawCount: jest.Mock;
    rawFindMany: jest.Mock;
    findUnique: jest.Mock;
  };
  let followingService: { get: jest.Mock };
  let service: PhotographerService;

  const requestDto = (extra: Partial<FindAllPhotographerRequestDto> = {}) =>
    Object.assign(new FindAllPhotographerRequestDto(), {
      limit: 10,
      page: 1,
      ...extra,
    });

  beforeEach(() => {
    photoService = {
      findAllWithUpvoteAndCommentCountByUserId: jest.fn(),
      findAll: jest.fn(),
    };
    keycloakService = { findUsersHasRole: jest.fn() };
    userRepository = {
      rawCount: jest.fn(),
      rawFindMany: jest.fn(),
      findUnique: jest.fn(),
    };
    followingService = { get: jest.fn() };

    service = new PhotographerService(
      photoService as unknown as PhotoService,
      keycloakService as unknown as KeycloakService,
      userRepository as unknown as UserRepository,
      followingService as unknown as FollowingService,
    );
  });

  describe('getAllPhotographer', () => {
    it('returns an empty page when nobody has the photographer role', async () => {
      keycloakService.findUsersHasRole.mockResolvedValue([
        { username: 'no-id' },
      ]);

      const result = await service.getAllPhotographer('me', requestDto());

      expect(keycloakService.findUsersHasRole).toHaveBeenCalledWith(
        Constants.PHOTOGRAPHER_ROLE,
        0,
        -1,
      );
      expect(result).toBeInstanceOf(FindAllPhotographerResponseDto);
      expect(result.totalRecord).toBe(0);
      expect(result.totalPage).toBe(0);
      expect(result.objects).toEqual([]);
      expect(userRepository.rawCount).not.toHaveBeenCalled();
    });

    it('counts and pages photographers with a normalized search', async () => {
      keycloakService.findUsersHasRole.mockResolvedValue([
        { id: 'p1' },
        { username: 'without-id' },
        { id: 'p2' },
      ]);
      userRepository.rawCount.mockResolvedValue([{ count: BigInt(15) }]);
      userRepository.rawFindMany.mockResolvedValue([
        { id: 'p1', name: 'Phúc', ftpPassword: 'secret' },
      ]);

      const result = await service.getAllPhotographer(
        'me',
        requestDto({ search: '  Phúc ', isFollowed: true }),
      );

      expect(userRepository.rawCount).toHaveBeenCalledWith(
        'me',
        ['p1', 'p2'],
        'phuc',
        true,
      );
      expect(userRepository.rawFindMany).toHaveBeenCalledWith(
        'me',
        ['p1', 'p2'],
        10,
        10,
        'phuc',
        true,
      );
      expect(result.totalRecord).toBe(15);
      expect(result.totalPage).toBe(2);
      expect(result.objects[0]).toBeInstanceOf(PhotographerDTO);
      expect(result.objects[0].id).toBe('p1');
    });

    it('uses an empty search when none is given', async () => {
      keycloakService.findUsersHasRole.mockResolvedValue([{ id: 'p1' }]);
      userRepository.rawCount.mockResolvedValue([{ count: BigInt(0) }]);
      userRepository.rawFindMany.mockResolvedValue([]);

      const result = await service.getAllPhotographer('', requestDto());

      expect(userRepository.rawCount).toHaveBeenCalledWith(
        '',
        ['p1'],
        '',
        undefined,
      );
      expect(result.objects).toEqual([]);
    });
  });

  describe('getPhotographerProfileById', () => {
    const photographer = {
      id: 'p1',
      name: 'Photographer',
      _count: { followers: 4, followings: 2, photos: 3 },
      followers: [],
      followings: [],
    };

    it('throws when the photographer does not exist', async () => {
      userRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.getPhotographerProfileById('me', 'p1'),
      ).rejects.toBeInstanceOf(PhotographerNotFoundException);
      expect(
        photoService.findAllWithUpvoteAndCommentCountByUserId,
      ).not.toHaveBeenCalled();
    });

    it('builds the profile with summed votes/comments for a followed photographer', async () => {
      userRepository.findUnique.mockResolvedValue(photographer);
      photoService.findAllWithUpvoteAndCommentCountByUserId.mockResolvedValue([
        { _count: { votes: 2, comments: 1 } },
        { _count: { votes: 5, comments: 4 } },
      ]);
      followingService.get.mockResolvedValue({ follower: { id: 'me' } });

      const profile = await service.getPhotographerProfileById('me', 'p1');

      expect(userRepository.findUnique).toHaveBeenCalledWith('p1', {
        _count: { select: { followers: true, followings: true, photos: true } },
        followers: true,
        followings: true,
      });
      expect(followingService.get).toHaveBeenCalledWith('me', 'p1');
      expect(profile).toBeInstanceOf(PhotographerProfileDto);
      expect(profile.photographer).toBeInstanceOf(PhotographerDTO);
      expect(profile.photographer.id).toBe('p1');
      expect(profile.photographer.isFollowed).toBe(true);
      expect(profile.upvoteCount).toBe(7);
      expect(profile.commentCount).toBe(5);
      expect(profile.followersCount).toBe(4);
      expect(profile.followingsCount).toBe(2);
    });

    it('marks the photographer as not followed and zero counts without photos', async () => {
      userRepository.findUnique.mockResolvedValue(photographer);
      photoService.findAllWithUpvoteAndCommentCountByUserId.mockResolvedValue(
        [],
      );
      followingService.get.mockResolvedValue(null);

      const profile = await service.getPhotographerProfileById('me', 'p1');

      expect(profile.photographer.isFollowed).toBe(false);
      expect(profile.upvoteCount).toBe(0);
      expect(profile.commentCount).toBe(0);
    });
  });

  it('getPhotosOfMe finds the raw photos of the user', async () => {
    const filter = new FindAllPhotoFilterDto();
    photoService.findAll.mockResolvedValue({ objects: [] });

    await expect(service.getPhotosOfMe('me', filter)).resolves.toEqual({
      objects: [],
    });

    expect(filter.photographerId).toBe('me');
    expect(filter.photoType).toBe('RAW');
    expect(photoService.findAll).toHaveBeenCalledWith('me', filter);
  });
});
