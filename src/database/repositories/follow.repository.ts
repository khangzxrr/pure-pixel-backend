import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FollowRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(where: Prisma.FollowWhereInput, include: Prisma.FollowInclude) {
    return this.prismaService.extendedClient().follow.findMany({
      where,
      include,
    });
  }
}
