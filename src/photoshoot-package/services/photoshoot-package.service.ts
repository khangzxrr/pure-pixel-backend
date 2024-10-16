import { Inject, Injectable } from '@nestjs/common';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { plainToInstance } from 'class-transformer';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception';
import { RunOutOfPacakgeQuotaException } from '../exceptions/run-out-of-package-quota.exception';
import { PrismaService } from 'src/prisma.service';
import { PrismaPromise } from '@prisma/client';

@Injectable()
export class PhotoshootPackageService {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,
    @Inject() private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, createDto: PhotoshootPackageCreateRequestDto) {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.packageCount >= user.maxPackageCount) {
      throw new RunOutOfPacakgeQuotaException();
    }

    const photoshootPackageCreateQuery = this.photoshootRepository.create({
      user: {
        connect: {
          id: userId,
        },
      },
      status: 'ENABLED',
      price: createDto.price,
      title: createDto.title,
      subtitle: createDto.subtitle,
      thumbnail: createDto.thumbnail,
      details: {
        createMany: {
          data: createDto.details,
        },
      },
    });

    const updatePackageQuotaQuery = this.userRepository.updateUser(user.id, {
      packageCount: {
        increment: 1,
      },
    });

    const [photoshootPackage] = await this.prisma
      .extendedClient()
      .$transaction([photoshootPackageCreateQuery, updatePackageQuotaQuery]);

    return plainToInstance(PhotoshootPackageDto, photoshootPackage);
  }

  async findAll(findAllDto: PhotoshootPackageFindAllDto) {
    const count = await this.photoshootRepository.count(findAllDto.toWhere());

    const packages = await this.photoshootRepository.findAll(
      findAllDto.limit,
      findAllDto.toSkip(),
      findAllDto.toWhere(),
    );

    const packageDtos = plainToInstance(PhotoshootPackageDto, packages);

    return new PhotoshootPackageFindAllResponseDto(
      findAllDto.limit,
      count,
      packageDtos,
    );
  }
}
