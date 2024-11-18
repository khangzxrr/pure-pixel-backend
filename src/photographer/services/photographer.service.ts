import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PhotoService } from 'src/photo/services/photo.service';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { FindAllPhotographerResponseDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.response.dto';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from '../exceptions/photographer-not-found.exception';
import { PhotographerProfileDto } from '../dtos/photographer-profile.dto';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';
import { plainToInstance } from 'class-transformer';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoVoteRepository } from 'src/database/repositories/photo-vote.repository';
import { Constants } from 'src/infrastructure/utils/constants';

@Injectable()
export class PhotographerService {
  constructor(
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoVoteRepository: PhotoVoteRepository,
    private readonly prisma: PrismaService,
  ) {}
  async getInfo(userId: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async getAllPhotographer(
    userId: string,
    findAllRequestDto: FindAllPhotographerRequestDto,
  ): Promise<FindAllPhotographerResponseDto> {
    const keycloakUsers = await this.keycloakService.findUsersHasRole(
      Constants.PHOTOGRAPHER_ROLE,
      0,
      -1,
    );

    const where = findAllRequestDto.toWhere(userId);

    const keycloakUserIds = keycloakUsers.map((u) => u.id);

    const count = await this.userRepository.count({
      AND: [
        {
          id: {
            in: keycloakUserIds,
          },
        },
        {
          ...where,
        },
      ],
    });

    const photographers = await this.userRepository.findMany(
      {
        AND: [
          {
            id: {
              in: keycloakUserIds,
            },
          },
          {
            ...where,
          },
        ],
      },
      findAllRequestDto.toOrderBy(),
      {
        followers: {
          where: {
            followerId: userId,
          },
        },
        followings: {
          where: {
            followingId: userId,
          },
        },
      },
      findAllRequestDto.toSkip(),
      findAllRequestDto.limit,
    );

    const dtoPromises = photographers.map(async (p) => {
      const dto = plainToInstance(PhotographerDTO, p);

      dto.photoCount = await this.photoRepository.count({
        photographerId: p.id,
      });

      const voteAggregate = await this.photoVoteRepository.aggregate({
        isUpvote: true,
        photo: {
          photographerId: p.id,
        },
      });

      dto.voteCount = voteAggregate._count.id;

      return dto;
    });

    const dtos = await Promise.all(dtoPromises);

    return new FindAllPhotographerResponseDto(
      findAllRequestDto.limit,
      count,
      dtos,
    );
  }

  async getPhotographerProfileById(userId: string, id: string) {
    const userFilterDto = new UserFilterDto();
    userFilterDto.id = id;

    const photographer = await this.userRepository.findUnique(id, {
      _count: {
        select: {
          followers: true,
          followings: true,
          photos: true,
        },
      },

      followers: {
        where: {
          followerId: userId,
        },
      },
      followings: {
        where: {
          followingId: userId,
        },
      },
    });

    if (!photographer) {
      throw new PhotographerNotFoundException();
    }

    const photos =
      await this.photoService.findAllWithUpvoteAndCommentCountByUserId(id);

    const profile = new PhotographerProfileDto();
    profile.photographer = plainToInstance(PhotographerDTO, photographer);

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

    return await this.photoService.findAll(userId, filter);
  }
}
