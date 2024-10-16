import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootPackageDetailRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PhotoshootDetailCreateInput) {
    return this.prisma.extendedClient().photoshootDetail.create({
      data,
    });
  }
}
