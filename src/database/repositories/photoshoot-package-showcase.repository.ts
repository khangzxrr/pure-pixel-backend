import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootPackageShowcaseRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: Prisma.PhotoshootPackageShowcasePhotoCreateInput) {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.create({
        data,
      });
  }

  count(where: Prisma.PhotoshootPackageShowcasePhotoWhereInput) {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.count({
        where,
      });
  }

  findMany(
    where: Prisma.PhotoshootPackageShowcasePhotoWhereInput,
    skip?: number,
    take?: number,
  ): PrismaPromise<any[]> {
    return this.prismaService
      .extendedClient()
      .photoshootPackageShowcasePhoto.findMany({
        where,
        skip,
        take,
      });
  }

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
