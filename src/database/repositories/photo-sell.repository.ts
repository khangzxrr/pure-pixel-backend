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
        price: photoSell.price,
        description: photoSell.description,
        active: true,
      },
    });
  }
}
