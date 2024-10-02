import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoSharingRepository {
  constructor(@Inject() private readonly prisma: PrismaService) {}

  findUniqueById(id: string) {
    return this.prisma.extendedClient().photoSharing.findUnique({
      where: {
        id,
      },
      include: {
        originalPhoto: {
          include: {
            photographer: true,
          },
        },
      },
    });
  }

  findAllByOriginalPhotoId(originalPhotoId: string) {
    return this.prisma.extendedClient().photoSharing.findMany({
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
    return this.prisma.extendedClient().photoSharing.create({
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
