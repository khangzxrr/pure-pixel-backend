import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootPackageDetailRepository {
  constructor(private readonly prisma: PrismaService) {}

  delete(id: string) {
    return this.prisma.extendedClient().photoshootDetail.delete({
      where: {
        id,
      },
    });
  }

  update(id: string, data: Prisma.PhotoshootDetailUpdateInput) {
    return this.prisma.extendedClient().photoshootDetail.update({
      where: {
        id,
      },
      data,
    });
  }

  findUniqueByIdOrThrow(id: string, photoshootPackageId: string) {
    return this.prisma.extendedClient().photoshootDetail.findUniqueOrThrow({
      where: {
        id,
        photoshootPackageId,
      },
    });
  }

  create(data: Prisma.PhotoshootDetailCreateInput) {
    return this.prisma.extendedClient().photoshootDetail.create({
      data,
    });
  }
}
