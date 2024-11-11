import { Inject, Injectable } from '@nestjs/common';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { plainToInstance } from 'class-transformer';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { RunOutOfPackageQuotaException } from '../exceptions/run-out-of-package-quota.exception';
import { PrismaService } from 'src/prisma.service';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { v4 } from 'uuid';
import { PhotoshootPackageNotBelongException } from '../exceptions/photoshoot-package-not-belong.exception';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { BunnyService } from 'src/storage/services/bunny.service';
import {
  PhotoshootPackage,
  PhotoshootPackageDetail,
} from 'src/database/types/photoshoot-package';
import { PrismaPromise } from '@prisma/client';

@Injectable()
export class PhotoshootPackageService {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject()
    private readonly prisma: PrismaService,
  ) {}

  async replace(
    userId: string,
    id: string,
    replaceDto: PhotoshootPackageReplaceRequestDto,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    if (replaceDto.thumbnail) {
      await this.photoProcessService.uploadFromBuffer(
        photoshootPackage.thumbnail,
        replaceDto.thumbnail.buffer,
      );
    }

    const updatedPhotoshootPackage = await this.photoshootRepository.updateById(
      id,
      {
        price: replaceDto.price,
        title: replaceDto.title,
        subtitle: replaceDto.subtitle,
        description: replaceDto.description,
      },
    );

    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      updatedPhotoshootPackage,
    );

    photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
      photoshootPackageDto.thumbnail,
    );

    return photoshootPackageDto;
  }

  async delete(userId: string, id: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const deletedPhotoshootPacakge = await this.photoshootRepository.delete(id);

    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      deletedPhotoshootPacakge,
    );

    photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
      photoshootPackageDto.thumbnail,
    );

    return photoshootPackageDto;
  }

  async update(
    userId: string,
    id: string,
    updateDto: PhotoshootPackageUpdateRequestDto,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    if (updateDto.thumbnail) {
      await this.photoProcessService.uploadFromBuffer(
        photoshootPackage.thumbnail,
        updateDto.thumbnail.buffer,
      );
    }

    const updatedPhotoshootPackage = await this.photoshootRepository.updateById(
      id,
      {
        price: updateDto.price,
        title: updateDto.title,
        subtitle: updateDto.subtitle,
        description: updateDto.description,
      },
    );

    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      updatedPhotoshootPackage,
    );

    photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
      photoshootPackageDto.thumbnail,
    );

    return photoshootPackageDto;
  }

  async create(userId: string, createDto: PhotoshootPackageCreateRequestDto) {
    const user = await this.userRepository.findUniqueOrThrow(userId);

    if (user.packageCount >= user.maxPackageCount) {
      throw new RunOutOfPackageQuotaException();
    }

    const thumbnailKey = `photoshoot_thumbnail/${v4()}.jpg`;
    await this.photoProcessService.uploadFromBuffer(
      thumbnailKey,
      createDto.thumbnail.buffer,
    );

    const showcaseKeysPromises = createDto.showcases.map(async (showcase) => {
      const showcaseKey = `photoshoot_showcase/${v4()}.${showcase.extension}`;
      await this.photoProcessService.uploadFromBuffer(
        showcaseKey,
        showcase.buffer,
      );

      return showcaseKey;
    });

    const showcaseKeys = await Promise.all(showcaseKeysPromises);

    const photoshootPackageCreateQuery: PrismaPromise<any> =
      this.photoshootRepository.create({
        user: {
          connect: {
            id: userId,
          },
        },
        status: 'ENABLED',
        price: createDto.price,
        title: createDto.title,
        subtitle: createDto.subtitle,
        thumbnail: thumbnailKey,
        description: createDto.description,
        showcases: {
          create: showcaseKeys.map((showcase) => {
            return {
              photoUrl: showcase,
            };
          }),
        },
      });

    const updatePackageQuotaQuery = this.userRepository.update(user.id, {
      packageCount: {
        increment: 1,
      },
    });

    const [photoshootPackage] = await this.prisma
      .extendedClient()
      .$transaction([photoshootPackageCreateQuery, updatePackageQuotaQuery]);

    return await this.signPhotoshootPackageDetail(photoshootPackage);
  }

  async signPhotoshootPackageDetail(
    photoshootPackageDetail: PhotoshootPackageDetail,
  ) {
    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      photoshootPackageDetail,
    );

    photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
      photoshootPackageDto.thumbnail,
    );

    photoshootPackageDto.showcases.map((showcase) => {
      showcase.photoUrl = this.bunnyService.getPresignedFile(showcase.photoUrl);

      return showcase;
    });

    return photoshootPackageDto;
  }

  async signPhotoshootPackage(photoshootPackage: PhotoshootPackage) {
    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      photoshootPackage,
    );

    photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
      photoshootPackageDto.thumbnail,
    );

    return photoshootPackageDto;
  }

  async getById(id: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    return await this.signPhotoshootPackageDetail(photoshootPackage);
  }

  async findAll(findAllDto: PhotoshootPackageFindAllDto) {
    const count = await this.photoshootRepository.count(findAllDto.toWhere());

    const packages = await this.photoshootRepository.findAll(
      findAllDto.limit,
      findAllDto.toSkip(),
      findAllDto.toWhere(),
    );

    const packageDtoPromises = packages.map(async (p) => {
      const dto = await this.signPhotoshootPackage(p);

      return dto;
    });

    const packageDtos = await Promise.all(packageDtoPromises);

    return new PhotoshootPackageFindAllResponseDto(
      findAllDto.limit,
      count,
      packageDtos,
    );
  }

  async findAllByUserId(
    userId: string,
    findAllDto: PhotoshootPackageFindAllDto,
  ) {
    findAllDto.userId = userId;

    const count = await this.photoshootRepository.count(findAllDto.toWhere());

    const packages = await this.photoshootRepository.findAll(
      findAllDto.limit,
      findAllDto.toSkip(),
      findAllDto.toWhere(),
    );

    const packageDtoPromises = packages.map(async (p) => {
      const dto = await this.signPhotoshootPackage(p);

      return dto;
    });

    const packageDtos = await Promise.all(packageDtoPromises);

    return new PhotoshootPackageFindAllResponseDto(
      findAllDto.limit,
      count,
      packageDtos,
    );
  }
}
