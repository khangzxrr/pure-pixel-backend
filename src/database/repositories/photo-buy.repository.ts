import { Injectable } from '@nestjs/common';
import { PhotoBuy } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoBuyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByPhotoSellIdAndBuyerId(photoSellId: string, buyerId: string) {
    return this.prisma.photoBuy.findFirst({
      where: {
        photoSellId,
        buyerId,
      },
    });
  }

  async create(photoBuy: PhotoBuy) {
    return this.prisma.photoBuy.create({
      data: photoBuy,
    });
  }
}
