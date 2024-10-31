import { Inject, Injectable } from '@nestjs/common';
import { BookmarkRepository } from 'src/database/repositories/bookmark.repository';

import { plainToInstance } from 'class-transformer';
import { BookmarkDto } from '../dtos/bookmark.dto';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivateException } from '../exceptions/photo-is-privated.exception';

@Injectable()
export class BookmarkService {
  constructor(
    @Inject() private readonly bookmarkRepository: BookmarkRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
  ) {}

  async create(userId: string, photoId: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    if (photo.visibility === 'PRIVATE') {
      throw new PhotoIsPrivateException();
    }

    const bookmark = await this.bookmarkRepository.upsert(
      {
        userId_photoId: {
          userId,
          photoId,
        },
      },
      {
        user: {
          connect: {
            id: userId,
          },
        },
        photo: {
          connect: {
            id: photoId,
          },
        },
      },
    );

    return plainToInstance(BookmarkDto, bookmark);
  }

  async delete(userId: string, photoId: string) {
    const deletedBookmark = await this.bookmarkRepository.delete({
      userId_photoId: {
        userId,
        photoId,
      },
    });

    return plainToInstance(BookmarkDto, deletedBookmark);
  }
}
