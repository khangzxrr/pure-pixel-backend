import { Inject, Injectable } from '@nestjs/common';
import { NewsfeedRepository } from 'src/database/repositories/newsfeed.repository';
import { NewsfeedFindAllDto } from '../dtos/rest/newsfeed-find-all.dto';
import { Newsfeed, Prisma } from '@prisma/client';
import { NewsfeedCreateDto } from '../dtos/newsfeed.create.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { SomeUserNotFoundException } from '../exceptions/some-user-not-found.exception';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SomePhotoNotFoundException } from '../exceptions/some-photo-not-found.exception';
import { PhotoService } from 'src/photo/services/photo.service';
import { plainToInstance } from 'class-transformer';
import { NewsfeedDto } from '../dtos/newsfeed.dto';
import { NewsfeedFindAllResponseDto } from '../dtos/rest/newfeed-find-all.response.dto';
import { NewsfeedUpdateDto } from '../dtos/newsfeed.update.dto';
import { NewsfeedNotBelongException } from '../exceptions/newsfeed-not-belong.exception';

@Injectable()
export class NewsfeedService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly newsfeedReposity: NewsfeedRepository,
    @Inject() private readonly photoService: PhotoService,
  ) {}

  async update(
    userId: string,
    newsfeedId: string,
    updateDto: NewsfeedUpdateDto,
  ) {
    const newsfeed = await this.newsfeedReposity.findUniqueOrThrow(
      {
        id: newsfeedId,
      },
      {},
    );

    if (newsfeed.userId !== userId) {
      throw new NewsfeedNotBelongException();
    }

    const newsfeedUpdateInput: Prisma.NewsfeedUpdateInput = {
      title: updateDto.title,
      description: updateDto.description,
      visibility: updateDto.visibility,
    };

    if (updateDto.photos) {
      const photos = await this.photoRepository.findAllWithoutPaging({
        id: {
          in: updateDto.photos,
        },
        photographerId: userId,
      });

      if (photos.length !== updateDto.photos.length) {
        throw new SomePhotoNotFoundException();
      }

      newsfeedUpdateInput.photos = {
        deleteMany: {},
        connect: updateDto.photos.map((p) => {
          return {
            id: p,
          };
        }),
      };
    }

    if (updateDto.permissions) {
      const users = await this.userRepository.findManyWithoutPaging({
        id: {
          in: updateDto.permissions.map((p) => p.userId),
        },
      });

      if (users.length !== updateDto.permissions.length) {
        throw new SomeUserNotFoundException();
      }

      newsfeedUpdateInput.permissions = {
        deleteMany: {},
        create: updateDto.permissions.map((p) => {
          return {
            user: {
              connect: {
                id: p.userId,
              },
            },
            permission: p.permission,
          };
        }),
      };
    }

    const updatedNewsfeed = await this.newsfeedReposity.update(
      {
        id: newsfeedId,
      },
      newsfeedUpdateInput,
    );

    const dto = plainToInstance(NewsfeedDto, updatedNewsfeed);

    console.log(dto);
    return dto;
  }

  async create(userId: string, createDto: NewsfeedCreateDto) {
    const photos = await this.photoRepository.findAllWithoutPaging({
      id: {
        in: createDto.photos,
      },
      photographerId: userId,
    });

    if (photos.length !== createDto.photos.length) {
      throw new SomePhotoNotFoundException();
    }

    const users = await this.userRepository.findManyWithoutPaging({
      id: {
        in: createDto.permissions.map((p) => p.userId),
      },
    });

    if (users.length !== createDto.permissions.length) {
      throw new SomeUserNotFoundException();
    }

    createDto.permissions.forEach(async (p) => {
      await this.userRepository.findUniqueOrThrow(p.userId);
    });

    return this.newsfeedReposity.create({
      user: {
        connect: {
          id: userId,
        },
      },
      permissions: {
        create: createDto.permissions.map((p) => {
          return {
            user: {
              connect: {
                id: p.userId,
              },
            },
            permission: p.permission,
          };
        }),
      },
      photos: {
        connect: createDto.photos.map((p) => {
          return {
            id: p,
          };
        }),
      },
      title: createDto.title,
      description: createDto.description,
      visibility: createDto.visibility,
    });
  }

  async findAll(
    userId: string,
    findallDto: NewsfeedFindAllDto,
  ): Promise<NewsfeedFindAllResponseDto> {
    const where: Prisma.NewsfeedWhereInput = {};

    //permission
    //userId | ALLOW
    //
    if (!findallDto.visibility || findallDto.visibility.length === 0) {
      findallDto.visibility = ['PUBLIC', 'ONLY_ME', 'ONLY_FOLLOWING'];
    }

    if (findallDto.visibility) {
      where.OR = [];
      if (findallDto.visibility.indexOf('PUBLIC') >= 0) {
        where.OR.push({
          visibility: 'PUBLIC',
        });
      }

      if (findallDto.visibility.indexOf('ONLY_FOLLOWING') >= 0) {
        where.OR.push({
          AND: [
            { visibility: 'ONLY_FOLLOWING' },
            {
              user: {
                followers: {
                  some: {
                    followerId: userId,
                  },
                },
              },
            },
          ],
        });
      }

      if (findallDto.visibility.indexOf('ONLY_ME') >= 0) {
        where.OR.push({
          AND: [{ visibility: 'ONLY_ME', userId }],
        });
      }

      if (findallDto.visibility.indexOf('ONLY_CHOOSED') >= 0) {
        where.OR.push({
          AND: [
            {
              visibility: 'ONLY_CHOOSED',
              permissions: {
                some: {
                  userId,
                  permission: 'ALLOW',
                },
              },
            },
          ],
        });
      }
    }

    where.AND = [
      {
        permissions: {
          none: {
            userId,
            permission: 'DENY',
          },
        },
      },
    ];

    const count = await this.newsfeedReposity.count(where);

    const newsfeeds = await this.newsfeedReposity.findMany(
      where,
      {
        user: {
          include: {
            followers: true,
          },
        },
        photos: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            photos: true,
          },
        },
      },
      findallDto.toSkip(),
      findallDto.limit,
    );

    const promises = newsfeeds.map(async (nf) => {
      const dto = plainToInstance(NewsfeedDto, nf);

      dto.photos = await this.photoService.signPhotos(nf.photos);

      return dto;
    });

    const newsfeedDtos = await Promise.all(promises);

    const response = new NewsfeedFindAllResponseDto(
      findallDto.limit,
      count,
      newsfeedDtos,
    );

    return response;
  }
}
