import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootPackageReviewRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsert(where: Prisma.ReviewWhereUniqueInput, data: Prisma.ReviewCreateInput) {
    return this.prismaService.review.upsert({
      where,
      update: {},
      create: data,
    });
  }
}
