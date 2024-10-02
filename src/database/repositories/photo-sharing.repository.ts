import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSharingRepository {
  constructor(@Inject() private readonly prisma: PrismaService) {}

  findAllByOriginalPhotoId(originalPhotoId: string) {
    return this.prisma.photoSharing.findMany({
      where: {
        originalPhotoId,
      },
    });
  }

  create(
    originalPhotoId: string,
    watermark: boolean,
    quality: string,
    sharePhotoUrl: string,
  ) {
    return this.prisma.photoSharing.create({
      data: {
        watermark,
        sharePhotoUrl,
        quality,
        originalPhoto: {
          connect: {
            id: originalPhotoId,
          },
        },
      },
    });
  }
}
