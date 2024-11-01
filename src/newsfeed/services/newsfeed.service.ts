import { Inject, Injectable } from '@nestjs/common';
import { NewsfeedRepository } from 'src/database/repositories/newsfeed.repository';
import { NewsfeedFindAllDto } from '../dtos/rest/newsfeed-find-all.dto';
import { Prisma } from '@prisma/client';
import { NewsfeedCreateDto } from '../dtos/newsfeed.create.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { SomeUserNotFoundException } from '../exceptions/some-user-not-found.exception';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SomePhotoNotFoundException } from '../exceptions/some-photo-not-found.exception';
import { PhotoService } from 'src/photo/services/photo.service';
import { plainToInstance } from 'class-transformer';
import { NewsfeedDto } from '../dtos/newsfeed.dto';
import { NewsfeedFindAllResponseDto } from '../dtos/rest/newfeed-find-all.response.dto';

@Injectable()
export class NewsfeedService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly newsfeedReposity: NewsfeedRepository,
    @Inject() private readonly photoService: PhotoService,
  ) {}

  async create(userId: string, createDto: NewsfeedCreateDto) {
    console.log(createDto);

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
    console.log(findallDto);

    const where: Prisma.NewsfeedWhereInput = {
      permissions: {
        some: {
          userId,
          permission: 'ALLOW',
        },
        none: {
          userId,
          permission: 'DENY',
        },
      },
    };

    if (findallDto.visibility) {
      where.visibility = {
        in: findallDto.visibility,
      };

      if (findallDto.visibility.indexOf('ONLY_FOLLOWING') >= 0) {
        where.user = {
          followers: {
            some: {
              followerId: userId,
            },
          },
        };
      }

      if (findallDto.visibility.indexOf('ONLY_ME') >= 0) {
        where.userId = userId;
      }
    }

    const count = await this.newsfeedReposity.count(where);

    const newsfeeds = await this.newsfeedReposity.findMany(
      {
        visibility: {
          in: findallDto.visibility,
        },
      },
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
