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
import { PhotoshootPackageShowcaseUpdateDto } from '../dtos/rest/photoshoot-package-showcase.update.dto';
import { PhotoshootPackageShowcaseRepository } from 'src/database/repositories/photoshoot-package-showcase.repository';
import { PhotoshootPackageShowcaseDto } from '../dtos/photoshoot-package-showcase.dto';
import { PhotoshootPackageShowcaseFindAllDto } from '../dtos/rest/photoshoot-package-showcase.find-all.request.dto';
import { PhotoshootPackageShowcaseFindAllResponseDto } from '../dtos/rest/photoshoot-package-showcase.find-all.response.dto';
import { FileSystemPhotoshootPackageCreateRequestDto } from '../dtos/rest/file-system-photoshoot-package-create.request.dto';
import { TemporaryfileService } from 'src/temporary-file/services/temporary-file.service';
import { InjectQueue } from '@nestjs/bullmq';
import { PhotoshootPackageConstant } from '../constants/photoshoot-package.constant';
import { Queue } from 'bullmq';
import { PhotoshootPackageDisabledException } from 'src/booking/exceptions/photoshoot-package-disabled.exception';

@Injectable()
export class PhotoshootPackageService {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject()
    private readonly prisma: PrismaService,
    @Inject()
    private readonly photoshootPackageShowcaseRepository: PhotoshootPackageShowcaseRepository,
    @Inject()
    private readonly temporaryfileService: TemporaryfileService,
    @InjectQueue(PhotoshootPackageConstant.PHOTOSHOOT_PACKAGE_QUEUE)
    private readonly photoshootPackagequeue: Queue,
  ) {}

  async filesystemCreate(
    userId: string,
    createDto: FileSystemPhotoshootPackageCreateRequestDto,
  ) {
    const user = await this.userRepository.findUniqueOrThrow(userId);

    if (user.packageCount >= user.maxPackageCount) {
      throw new RunOutOfPackageQuotaException();
    }

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
        sourceStatus: 'FILESYSTEM',
        thumbnail: createDto.thumbnail.path,
        description: createDto.description,
        showcases: {
          create: createDto.showcases.map((showcase) => {
            return {
              photoUrl: showcase.path,
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

    await this.photoshootPackagequeue.add(
      PhotoshootPackageConstant.UPLOAD_TO_CLOUD,
      {
        photoshootPackageId: photoshootPackage.id,
      },
    );

    return await this.signPhotoshootPackageDetail(photoshootPackage);
  }

  async findAllShowcase(
    userId: string,
    photoshootPackageId: string,
    findAllDto: PhotoshootPackageShowcaseFindAllDto,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const showcases = await this.photoshootPackageShowcaseRepository.findMany(
      {
        PhotoshootPackage: {
          userId,
          id: photoshootPackageId,
        },
      },
      findAllDto.toSkip(),
      findAllDto.limit,
      [
        {
          createdAt: 'desc',
        },
      ],
    );

    const count = await this.photoshootPackageShowcaseRepository.count({
      PhotoshootPackage: {
        userId,
        id: photoshootPackageId,
      },
    });

    const dtos = showcases.map((s) => {
      const dto = plainToInstance(PhotoshootPackageShowcaseDto, s);
      dto.photoUrl = this.bunnyService.getPresignedFile(dto.photoUrl);

      return dto;
    });

    return new PhotoshootPackageShowcaseFindAllResponseDto(
      findAllDto.limit,
      count,
      dtos,
    );
  }

  async createShowcase(
    userId: string,
    photoshootPackageId: string,
    createShowcaseDto: PhotoshootPackageShowcaseUpdateDto,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    if (photoshootPackage.status === 'DISABLED') {
      throw new PhotoshootPackageDisabledException();
    }

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      createShowcaseDto.showcase.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);

    const key = await this.bunnyService.uploadFromBuffer(
      `${v4()}.webp`,
      thumbnailBuffer,
    );

    const showcase = await this.photoshootPackageShowcaseRepository.create({
      PhotoshootPackage: {
        connect: {
          id: photoshootPackage.id,
          userId,
        },
      },
      photoUrl: key,
    });

    const dto = plainToInstance(PhotoshootPackageShowcaseDto, showcase);
    dto.photoUrl = this.bunnyService.getPresignedFile(showcase.photoUrl);

    return dto;
  }

  async replaceShowcase(
    userId: string,
    photoshootPackageId: string,
    showcaseId: string,
    updateShowcaseDto: PhotoshootPackageShowcaseUpdateDto,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    if (photoshootPackage.status === 'DISABLED') {
      throw new PhotoshootPackageDisabledException();
    }

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const showcase =
      await this.photoshootPackageShowcaseRepository.findByIdOrThrow(
        showcaseId,
      );

    await this.bunnyService.delete(showcase.photoUrl);
    const key = await this.bunnyService.upload(updateShowcaseDto.showcase);

    const updatedShowcase =
      await this.photoshootPackageShowcaseRepository.updateById(showcaseId, {
        photoUrl: key,
      });

    const dto = plainToInstance(PhotoshootPackageShowcaseDto, updatedShowcase);
    dto.photoUrl = this.bunnyService.getPresignedFile(dto.photoUrl);

    return dto;
  }

  async deleteShowcase(
    userId: string,
    photoshootPackageId: string,
    showcaseId: string,
  ) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    if (photoshootPackage.status === 'DISABLED') {
      throw new PhotoshootPackageDisabledException();
    }

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    const showcase =
      await this.photoshootPackageShowcaseRepository.findByIdOrThrow(
        showcaseId,
      );

    await this.bunnyService.delete(showcase.photoUrl);

    await this.photoshootPackageShowcaseRepository.deleteById(showcase.id);
    return true;
  }

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

    const deletedPhotoshootPackage = await this.photoshootRepository.delete(id);

    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      deletedPhotoshootPackage,
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

    if (photoshootPackage.status === 'DISABLED') {
      throw new PhotoshootPackageDisabledException();
    }

    if (photoshootPackage.userId !== userId) {
      throw new PhotoshootPackageNotBelongException();
    }

    if (updateDto.thumbnail) {
      await this.photoProcessService.uploadFromBuffer(
        photoshootPackage.thumbnail,
        updateDto.thumbnail.buffer,
      );

      await this.bunnyService.pruneCache(
        `${process.env.BUNNY_STORAGE_CDN}/${process.env.BUNNY_STORAGE_BUCKET}/${photoshootPackage.thumbnail}`,
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
      `?updatedAt=${updatedPhotoshootPackage.updatedAt.getTime()}`,
    );

    return photoshootPackageDto;
  }

  async create(userId: string, createDto: PhotoshootPackageCreateRequestDto) {
    const user = await this.userRepository.findUniqueOrThrow(userId);

    if (user.packageCount >= user.maxPackageCount) {
      throw new RunOutOfPackageQuotaException();
    }

    const thumbnailKey = `photoshoot_thumbnail/${v4()}.webp`;

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      createDto.thumbnail.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);
    await this.photoProcessService.uploadFromBuffer(
      thumbnailKey,
      thumbnailBuffer,
    );

    const showcaseKeysPromises = createDto.showcases.map(async (showcase) => {
      const showcaseKey = `photoshoot_showcase/${v4()}.webp`;

      const showcaseSharp = await this.photoProcessService.sharpInitFromBuffer(
        showcase.buffer,
      );
      const showcaseThumbnailBuffer =
        await this.photoProcessService.makeThumbnail(showcaseSharp);
      await this.photoProcessService.uploadFromBuffer(
        showcaseKey,
        showcaseThumbnailBuffer,
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

    if (photoshootPackageDetail.sourceStatus === 'CLOUD') {
      photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
        photoshootPackageDto.thumbnail,
        `?updatedAt=${photoshootPackageDetail.updatedAt.getTime()}`,
      );
    } else {
      photoshootPackageDto.thumbnail =
        this.temporaryfileService.signFilesystemPath(
          photoshootPackageDto.thumbnail,
        );
    }

    photoshootPackageDto.showcases.map((showcase) => {
      if (photoshootPackageDetail.sourceStatus === 'CLOUD') {
        showcase.photoUrl = this.bunnyService.getPresignedFile(
          showcase.photoUrl,
        );
      } else {
        showcase.photoUrl = this.temporaryfileService.signFilesystemPath(
          showcase.photoUrl,
        );
      }

      return showcase;
    });

    return photoshootPackageDto;
  }

  async signPhotoshootPackage(photoshootPackage: PhotoshootPackage) {
    const photoshootPackageDto = plainToInstance(
      PhotoshootPackageDto,
      photoshootPackage,
    );

    if (photoshootPackage.sourceStatus === 'CLOUD') {
      photoshootPackageDto.thumbnail = this.bunnyService.getPresignedFile(
        photoshootPackageDto.thumbnail,
        `?updatedAt=${photoshootPackage.updatedAt.getTime()}`,
      );
    } else {
      photoshootPackageDto.thumbnail =
        this.temporaryfileService.signFilesystemPath(
          photoshootPackageDto.thumbnail,
        );
    }

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
    const where = findAllDto.toWhere();
    where.userId = userId;

    const count = await this.photoshootRepository.count(where);

    const packages = await this.photoshootRepository.findAll(
      findAllDto.limit,
      findAllDto.toSkip(),
      where,
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
