import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  groupBy(take: number) {
    return this.prisma.extendedClient().photoTag.groupBy({
      by: ['name'],
      take,
      _count: {
        photoId: true,
      },
      orderBy: {
        _count: {
          photoId: 'desc',
        },
      },
      where: {
        photo: {
          visibility: 'PUBLIC',
        },
      },
    });
  }

  deleteByPhotoId(photoId: string) {
    return this.prisma.extendedClient().photoTag.deleteMany({
      where: {
        photo: {
          id: photoId,
        },
      },
    });
  }

  create(photoId: string, name: string) {
    return this.prisma.photoTag.create({
      data: {
        name,
        photo: {
          connect: {
            id: photoId,
          },
        },
      },
    });
  }
}
