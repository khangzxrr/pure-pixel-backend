import { Inject, Injectable } from '@nestjs/common';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { plainToInstance } from 'class-transformer';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';

@Injectable()
export class PhotoshootPackage {
  constructor(
    @Inject() private readonly photoshootRepository: PhotoshootRepository,
  ) {}

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
