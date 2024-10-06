import { Injectable } from '@nestjs/common';
import { PhotoSell } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSellRepository {
  constructor(private prisma: PrismaService) {}

  async getByActiveAndId(photoId: string) {
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

  updateQuery(photoSell: PhotoSell) {
    return this.prisma.extendedClient().photoSell.update({
      where: {
        id: photoSell.id,
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
        price: photoSell.price,
        afterPhotoUrl: photoSell.afterPhotoUrl,
        description: photoSell.description,
        active: true,
      },
    });
  }
}
