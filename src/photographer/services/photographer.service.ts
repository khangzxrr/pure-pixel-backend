import { Inject, Injectable } from '@nestjs/common';
import { PhotoService } from 'src/photo/services/photo.service';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { IdentityService } from 'src/authen/services/identity.service';
import { FindAllPhotographerResponseDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.response.dto';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from '../exceptions/photographer-not-found.exception';
import { PhotographerProfileDto } from '../dtos/photographer-profile.dto';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';
import { plainToInstance } from 'class-transformer';
import { Constants } from 'src/infrastructure/utils/constants';

import { FollowingService } from './following.service';
import { Utils } from 'src/infrastructure/utils/utils';
import { Prisma } from '@prisma/client';

type PhotographerProfilePayload = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        followers: true;
        followings: true;
        photos: true;
      };
    };
    followers: true;
    followings: true;
  };
}>;

@Injectable()
export class PhotographerService {
  constructor(
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly keycloakService: IdentityService,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly followingService: FollowingService,
  ) {}

  async getAllPhotographer(
    userId: string,
    findAllRequestDto: FindAllPhotographerRequestDto,
  ): Promise<FindAllPhotographerResponseDto> {
    const keycloakUsers = await this.keycloakService.findUsersHasRole(
      Constants.PHOTOGRAPHER_ROLE,
      0,
      -1,
    );
    const keycloakUserIds = keycloakUsers
      .map((u) => u.id)
      .filter((id): id is string => id !== undefined);

    //Prisma.join throws on an empty list, which happens before anyone has the photographer role
    if (keycloakUserIds.length === 0) {
      return new FindAllPhotographerResponseDto(findAllRequestDto.limit, 0, []);
    }

    const nameSearch = findAllRequestDto.search
      ? Utils.normalizeText(findAllRequestDto.search)
      : '';

    const rawCountQuery = await this.userRepository.rawCount(
      userId,
      keycloakUserIds,
      nameSearch,
      findAllRequestDto.isFollowed,
    );

    const rawPhotographers = await this.userRepository.rawFindMany(
      userId,
      keycloakUserIds,
      findAllRequestDto.toSkip(),
      findAllRequestDto.limit,
      nameSearch,
      findAllRequestDto.isFollowed,
    );

    const count: number = Number(
      (rawCountQuery as { count: bigint }[])[0].count,
    );

    const dtos = plainToInstance(PhotographerDTO, rawPhotographers);

    return new FindAllPhotographerResponseDto(
      findAllRequestDto.limit,
      count,
      dtos,
    );
  }

  async getPhotographerProfileById(userId: string, id: string) {
    const userFilterDto = new UserFilterDto();
    userFilterDto.id = id;

    const photographer = (await this.userRepository.findUnique(id, {
      _count: {
        select: {
          followers: true,
          followings: true,
          photos: true,
        },
      },

      followers: true,
      followings: true,
    })) as PhotographerProfilePayload | null;

    if (!photographer) {
      throw new PhotographerNotFoundException();
    }

    const photos =
      await this.photoService.findAllWithUpvoteAndCommentCountByUserId(id);

    const isFollowed = await this.followingService.get(userId, id);

    const profile = new PhotographerProfileDto();

    profile.photographer = plainToInstance(PhotographerDTO, photographer);

    if (isFollowed) {
      profile.photographer.isFollowed = true;
    } else {
      profile.photographer.isFollowed = false;
    }

    profile.upvoteCount = 0;
    profile.commentCount = 0;
    profile.followersCount = photographer._count.followers;
    profile.followingsCount = photographer._count.followings;

    photos.forEach((p) => {
      profile.upvoteCount += p._count.votes;
      profile.commentCount += p._count.comments;
    });

    return profile;
  }

  async getPhotosOfMe(userId: string, filter: FindAllPhotoFilterDto) {
    filter.photographerId = userId;
    filter.photoType = 'RAW';

    return await this.photoService.findAll(userId, filter);
  }
}
