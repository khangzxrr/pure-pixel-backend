import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootPackageShowcaseRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findByIdOrThrow(id: string) {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.findUniqueOrThrow({
        where: {
          id,
        },
      });
  }

  updateById(
    id: string,
    data: Prisma.PhotoshootPackageShowcasePhotoUpdateInput,
  ) {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.update({
        where: {
          id,
        },
        data,
      });
  }

  deleteById(id: string) {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.delete({
        where: {
          id,
        },
      });
  }
}
