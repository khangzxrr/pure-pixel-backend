import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSellRepository {
  constructor(private prisma: PrismaService) {}

  async findFirst(where: Prisma.PhotoSellWhereInput) {
    return this.prisma.extendedClient().photoSell.findFirst({
      where,
    });
  }

  async findUniqueOrThrow(where: Prisma.PhotoSellWhereUniqueInput) {
    return this.prisma.extendedClient().photoSell.findUniqueOrThrow({
      where,
      include: {
        photo: true,
        pricetags: true,
      },
    });
  }

  deactivatePhotoSellByPhotoIdQuery(photoId: string) {
    return this.prisma.extendedClient().photoSell.updateMany({
      where: {
        photoId,
      },
      data: {
        active: false,
      },
    });
  }

  updateMany(
    where: Prisma.PhotoSellWhereInput,
    data: Prisma.PhotoSellUpdateInput,
  ) {
    return this.prisma.extendedClient().photoSell.updateMany({
      where,
      data,
    });
  }

  createAndActiveByPhotoIdQuery(data: Prisma.PhotoSellCreateInput) {
    return this.prisma.extendedClient().photoSell.create({
      data,
    });
  }

  async findMany(
    where: Prisma.PhotoSellWhereInput,
    orderBy: Prisma.PhotoSellOrderByWithRelationInput[],
    include: Prisma.PhotoSellInclude,
  ) {
    return this.prisma.extendedClient().photoSell.findMany({
      where,
      orderBy,
      include,
    });
  }
}
