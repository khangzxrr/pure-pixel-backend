import { Inject, Injectable } from '@nestjs/common';
import { PhotoshootPackage } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';

import { PhotoshootPackageDetail } from 'src/database/types/photoshoot-package';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';

import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';

@Injectable()
export class ManagePhotoshootPackageService {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,

    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly bunnyService: BunnyService,
  ) {}

  async replace(id: string, replaceDto: PhotoshootPackageReplaceRequestDto) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

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

  async delete(id: string) {
    await this.photoshootRepository.findUniqueOrThrow(id);

    const deletedPhotoshootPackage = await this.photoshootRepository.delete(id);

    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      deletedPhotoshootPackage,
    );

    return photoshootPackageDto;
  }

  async update(id: string, updateDto: PhotoshootPackageUpdateRequestDto) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

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
      findAllDto.toOrderBy(),
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
      findAllDto.toOrderBy(),
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
