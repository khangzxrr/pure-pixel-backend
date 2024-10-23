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

@Injectable()
export class PhotoshootPackageService {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    private readonly prisma: PrismaService,
  ) {}

  async replace(
    userId: string,
    id: string,
    replaceDto: PhotoshootPackageReplaceRequestDto,
  ) {
    //TODO: finish replace photoshoot package method
    //
    // const photoshootPackage =
    //   await this.photoshootRepository.findUniqueOrThrow(id);
    //
    // if (photoshootPackage.userId !== userId) {
    //   throw new PhotoshootPackageNotBelongException();
    // }
    //
    // if (replaceDto.thumbnail) {
    //   await this.photoProcessService.makeThumbnailAndUploadFromBuffer(
    //     photoshootPackage.thumbnail,
    //     replaceDto.thumbnail.buffer,
    //   );
    // }
    //
    // const updatedPhotoshootPackage = await this.photoshootRepository.updateById(
    //   id,
    //   {
    //     price: replaceDto.price,
    //     title: replaceDto.title,
    //     subtitle: replaceDto.subtitle,
    //   },
    // );
    //
    // return plainToInstance(PhotoshootPackageDto, updatedPhotoshootPackage);
  }

  async delete(userId: string, id: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const deletedPhotoshootPacakge = await this.photoshootRepository.delete(id);

    return plainToInstance(PhotoshootPackageDto, deletedPhotoshootPacakge);
  }

  async update(
    userId: string,
    id: string,
    updateDto: PhotoshootPackageUpdateRequestDto,
  ) {
    //TODO: finish update photoshoot package
    // const photoshootPackage =
    //   await this.photoshootRepository.findUniqueOrThrow(id);
    //
    // if (photoshootPackage.userId !== userId) {
    //   throw new PhotoshootPackageNotBelongException();
    // }
    //
    // if (updateDto.thumbnail) {
    //   await this.photoProcessService.makeThumbnailAndUploadFromBuffer(
    //     photoshootPackage.thumbnail,
    //     updateDto.thumbnail.buffer,
    //   );
    // }
    //
    // const updatedPhotoshootPackage = await this.photoshootRepository.updateById(
    //   id,
    //   {
    //     price: updateDto.price,
    //     title: updateDto.title,
    //     subtitle: updateDto.subtitle,
    //   },
    // );
    //
    // return plainToInstance(PhotoshootPackageDto, updatedPhotoshootPackage);
  }

  async create(userId: string, createDto: PhotoshootPackageCreateRequestDto) {
    //TODO: finish create photoshoot package
    //
    // const user = await this.userRepository.findUniqueOrThrow(userId);
    //
    // if (user.packageCount >= user.maxPackageCount) {
    //   throw new RunOutOfPackageQuotaException();
    // }
    //
    // const thumbnailKey = `photoshoot_thumbnail/${v4()}.jpg`;
    // await this.photoProcessService.makeThumbnailAndUploadFromBuffer(
    //   thumbnailKey,
    //   createDto.thumbnail.buffer,
    // );
    //
    // const photoshootPackageCreateQuery = this.photoshootRepository.create({
    //   user: {
    //     connect: {
    //       id: userId,
    //     },
    //   },
    //   status: 'ENABLED',
    //   price: createDto.price,
    //   title: createDto.title,
    //   subtitle: createDto.subtitle,
    //   thumbnail: thumbnailKey,
    //   description: createDto.description,
    // });
    //
    // const updatePackageQuotaQuery = this.userRepository.updateUser(user.id, {
    //   packageCount: {
    //     increment: 1,
    //   },
    // });
    //
    // const [photoshootPackage] = await this.prisma
    //   .extendedClient()
    //   .$transaction([photoshootPackageCreateQuery, updatePackageQuotaQuery]);
    //
    // return plainToInstance(PhotoshootPackageDto, photoshootPackage);
  }

  async getById(id: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(id);

    return plainToInstance(PhotoshootPackageDto, photoshootPackage);
  }

  async findAllEnabledPackageByPhotographerId(
    photographerId: string,
    findAllDto: PhotoshootPackageFindAllDto,
  ) {
    findAllDto.status = 'ENABLED';

    return await this.findAllByUserId(photographerId, findAllDto);
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

    const packageDtos = plainToInstance(PhotoshootPackageDto, packages, {});

    return new PhotoshootPackageFindAllResponseDto(
      findAllDto.limit,
      count,
      packageDtos,
    );
  }
}
