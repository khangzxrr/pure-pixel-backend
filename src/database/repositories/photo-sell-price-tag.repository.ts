import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSellPriceTagRepository {
  constructor(private prisma: PrismaService) {}

  findByIdOrThrow(id: string) {
    return this.prisma.extendedClient().photoSell.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  findUniqueOrThrow(where: Prisma.PricetagWhereUniqueInput) {
    return this.prisma.extendedClient().pricetag.findFirstOrThrow({
      where,
    });
  }
}
