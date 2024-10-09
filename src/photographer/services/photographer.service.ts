import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoStatus } from '@prisma/client';
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

@Injectable()
export class PhotographerService {
  constructor(
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}
  async getInfo(userId: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async getAllPhotographerExceptUserId(
    userId: string,
    findAllRequestDto: FindAllPhotographerRequestDto,
  ): Promise<FindAllPhotographerResponseDto> {
    const count = await this.keycloakService.countPhotographer();

    const keycloakPhotographers =
      await this.keycloakService.findAllPhotographers(
        findAllRequestDto.toSkip(),
        findAllRequestDto.limit,
      );

    const photographerDtoPromises = keycloakPhotographers.map(async (p) => {
      const applicationUser = await this.userRepository.findOneById(p.id);

      if (!applicationUser) {
        return null;
      }

      return plainToInstance(PhotographerDTO, applicationUser);
    });

    const photographerDtos = await Promise.all(photographerDtoPromises);

    //filter out any null keycloak user
    //because sometime we use the same keycloak instance for both local and server
    //some user may appear in production, some may appear in local
    //that's why we have null user
    const photographerDtosWithNullFilter = photographerDtos.filter(
      (p) => p != null && p.id != userId,
    );

    return new FindAllPhotographerResponseDto(
      findAllRequestDto.limit,
      count,
      photographerDtosWithNullFilter,
    );
  }

  async getPhotographerProfileById(id: string) {
    const userFilterDto = new UserFilterDto();
    userFilterDto.id = id;

    const photographer =
      await this.userRepository.findOneWithCount(userFilterDto);

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
    filter.status = PhotoStatus.PARSED;
    filter.photographerId = userId;

    return await this.photoService.findAll(filter);
  }
}
