import { Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPhotoById(id: string) {
    return this.prisma.photo.findUnique({
      where: {
        id,
      },
    });
  }
  async getAllByVisibility(visibilityStr: string) {
    let visibility: PhotoVisibility = PhotoVisibility.PUBLIC;

    if (visibilityStr == PhotoVisibility.PRIVATE) {
      visibility = PhotoVisibility.PRIVATE;
    } else if (visibilityStr == PhotoVisibility.SHARE_LINK) {
      visibility = PhotoVisibility.SHARE_LINK;
    }

    return this.prisma.photo.findMany({
      where: {
        visibility,
      },
    });
  }
}
