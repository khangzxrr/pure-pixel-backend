import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({
      where,
    });
  }

  async findAll(
    skip: number,
    take: number,
    where: Prisma.NotificationWhereInput,
  ) {
    return this.prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({
      data,
    });
  }
}
