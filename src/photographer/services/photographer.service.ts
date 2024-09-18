import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { StorageService } from 'src/storage/services/storage.service';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoStatus } from '@prisma/client';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class PhotographerService {
  constructor(
    @Inject() private readonly storageService: StorageService,
    @Inject() private readonly photoService: PhotoService,
    private readonly prisma: PrismaService,
  ) {}
  async getInfo(userId: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  //TODO: finish getAllPhotographer with keycloak API
  async getAllPhotographerExceptUserId(
    userId: string,
  ): Promise<PhotographerDTO[]> {
    return [];
  }

  async getAllPhotographer(): Promise<PhotographerDTO[]> {
    return [];
  }

  async getPhotosOfMe(userId: string, filter: FindAllPhotoFilterDto) {
    filter.status = PhotoStatus.PARSED;
    filter.photographerId = userId;

    return await this.photoService.findAll(filter);
  }
}
