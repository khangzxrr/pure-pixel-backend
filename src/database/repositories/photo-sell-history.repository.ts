import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSellHistoryRepository {
  constructor(private prisma: PrismaService) {}

  count(where: Prisma.PhotoSellHistoryWhereInput) {
    return this.prisma.extendedClient().photoSellHistory.count({
      where,
    });
  }
}
