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
    findAllRequestDto: FindAllPhotographerRequestDto,
  ): Promise<FindAllPhotographerResponseDto> {
    let skip = 0;

    const keycloakUserIds: string[] = [];

    while (true) {
      const users = await this.keycloakService.findUsersHasRole(
        'photographer',
        skip,
        10,
      );

      users.forEach((u) => keycloakUserIds.push(u.id));

      if (users.length === 0) {
        break;
      }

      skip += 10;
    }

    const count = await this.userRepository.count({
      id: {
        in: keycloakUserIds,
      },
      ...findAllRequestDto.toWhere(),
    });

    const photographers = await this.userRepository.findMany(
      {
        id: {
          in: keycloakUserIds,
        },
        ...findAllRequestDto.toWhere(),
      },
      findAllRequestDto.toOrderBy(),
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

  async getPhotographerProfileById(id: string) {
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
