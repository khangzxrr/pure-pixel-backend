import { Injectable } from '@nestjs/common';
import { PhotoSell } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSellRepository {
  constructor(private prisma: PrismaService) {}

  async getByActiveAndPhotoId(photoId: string) {
    return this.prisma.extendedClient().photoSell.findFirst({
      where: {
        active: true,
        photoId,
      },
      include: {
        photo: true,
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

  updateQuery(id: string, photoSell: Partial<PhotoSell>) {
    return this.prisma.extendedClient().photoSell.update({
      where: {
        id: id,
      },
      data: photoSell,
    });
  }

  createAndActiveByPhotoIdQuery(photoSell: PhotoSell) {
    return this.prisma.extendedClient().photoSell.create({
      data: {
        photo: {
          connect: {
            id: photoSell.photoId,
          },
        },
        id: photoSell.id,
        price: photoSell.price,
        description: photoSell.description,
        colorGradingPhotoUrl: photoSell.colorGradingPhotoUrl,
        colorGradingPhotoWatermarkUrl: photoSell.colorGradingPhotoWatermarkUrl,
        active: true,
      },
    });
  }
}
