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
      const applicationUser = await this.userRepository.findOne({
        id: p.id,
        transactions: false,
        upgradeOrders: false,
        followings: false,
        followers: false,
      });

      if (!applicationUser) {
        return null;
      }

      return new PhotographerDTO({
        id: p.id,
        quote: applicationUser.quote,
        avatar: applicationUser.avatar,
        name: applicationUser.name,
        location: applicationUser.location,
        createdAt: applicationUser.createdAt,
        updatedAt: applicationUser.updatedAt,
      });
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

  async getPhotosOfMe(userId: string, filter: FindAllPhotoFilterDto) {
    filter.status = PhotoStatus.PARSED;
    filter.photographerId = userId;

    return await this.photoService.findAll(filter);
  }
}
