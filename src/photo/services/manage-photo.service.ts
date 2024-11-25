import { Inject, Injectable } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { PhotoService } from './photo.service';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { CategoryRepository } from 'src/database/repositories/category.repository';
import { PrismaPromise } from '@prisma/client';

import { CannotUpdateVisibilityPhotoHasActiveSellingException } from '../exceptions/cannot-update-visibility-photo-has-active-selling.exception';
import { CannotUpdateWatermarkPhotoHasActiveSellingException } from '../exceptions/cannot-update-watermark-photo-has-active-selling.exception';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { DuplicatedTagFoundException } from '../exceptions/duplicated-tag-found.exception';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { Utils } from 'src/infrastructure/utils/utils';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/services/user.service';

@Injectable()
export class ManagePhotoService {
  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoTagRepository: PhotoTagRepository,
    @Inject() private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(findAllDto: FindAllPhotoFilterDto) {
    const where = findAllDto.toWhere('');

    const count = await this.photoRepository.count(where);

    const photos = await this.photoRepository.findAll(
      where,
      findAllDto.toOrderBy(),
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const signedPhotos = await this.photoService.signPhotos(photos);

    return new PagingPaginatedResposneDto<SignedPhotoDto>(
      findAllDto.limit,
      count,
      signedPhotos,
    );
  }

  async update(id: string, photoUpdateDto: PhotoUpdateRequestDto) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    const exif = photo.exif;

    const prismaPromises: PrismaPromise<any>[] = [];

    if (photoUpdateDto.categoryIds) {
      const categories = await this.categoryRepository.findMany({
        id: {
          in: photoUpdateDto.categoryIds,
        },
      });

      if (categories.length !== photoUpdateDto.categoryIds.length) {
        throw new CategoryNotFoundException();
      }
    }

    //TODO: update exif to photo using queue
    if (photoUpdateDto.gps) {
      exif['latitude'] = photoUpdateDto.gps.latitude;
      exif['longitude'] = photoUpdateDto.gps.longitude;
    }

    if (photoUpdateDto.photoTags) {
      const setOftags = new Set(photoUpdateDto.photoTags);

      if (photoUpdateDto.photoTags.length !== setOftags.size) {
        throw new DuplicatedTagFoundException();
      }

      prismaPromises.push(this.photoTagRepository.deleteByPhotoId(id));

      setOftags.forEach((tag) =>
        prismaPromises.push(this.photoTagRepository.create(id, tag)),
      );
    }

    //prevent empty value
    if (!photoUpdateDto.categoryIds) {
      photoUpdateDto.categoryIds = [];
    }

    const activePhotoSellings = photo.photoSellings.find(
      (s) => s.active === true,
    );

    if (photoUpdateDto.watermark && activePhotoSellings) {
      throw new CannotUpdateWatermarkPhotoHasActiveSellingException();
    }

    if (photoUpdateDto.visibility && activePhotoSellings) {
      throw new CannotUpdateVisibilityPhotoHasActiveSellingException();
    }

    const normalizedTitle = photoUpdateDto.title
      ? Utils.normalizeText(photoUpdateDto.title)
      : Utils.normalizeText(photo.title);

    prismaPromises.push(
      this.photoRepository.updateByIdQuery(id, {
        categories: {
          connect: photoUpdateDto.categoryIds.map((id) => ({ id })),
        },
        title: photoUpdateDto.title,
        normalizedTitle,
        watermark: photoUpdateDto.watermark,
        description: photoUpdateDto.description,
        photoType: photoUpdateDto.photoType,
        visibility: photoUpdateDto.visibility,
        exif,
      }),
    );

    const prismaResults = await this.prisma
      .extendedClient()
      .$transaction(prismaPromises);

    const updatedPhoto = prismaResults[prismaResults.length - 1];

    return await this.photoService.signPhoto(updatedPhoto);
  }

  async delete(id: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    await this.userService.updatePhotoQuota(photo.photographerId, photo.size);

    return await this.photoRepository.deleteById(id);
  }
}
