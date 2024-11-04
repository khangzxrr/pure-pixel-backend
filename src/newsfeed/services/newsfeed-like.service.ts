import { Inject, Injectable } from '@nestjs/common';
import { NewsfeedLikeRepository } from 'src/database/repositories/newsfeed-like.repository';
import { NewsfeedService } from './newsfeed.service';

@Injectable()
export class NewsfeedLikeService {
  constructor(
    @Inject() private readonly newsfeedService: NewsfeedService,
    @Inject() private readonly newsfeedLikeRepository: NewsfeedLikeRepository,
  ) {}

  async findUnique(userId: string, newsfeedId: string) {
    const newfeedLike = await this.newsfeedLikeRepository.findUnique({
      newsfeedId_userId: {
        newsfeedId,
        userId,
      },
    });

    return newfeedLike;
  }

  async upsert(userId: string, newsfeedId: string) {
    await this.newsfeedService.validatePermission(userId, newsfeedId);

    const newsfeedLike = await this.newsfeedLikeRepository.upsert(
      {
        newsfeedId_userId: {
          newsfeedId,
          userId,
        },
      },
      {},
      {
        user: {
          connect: {
            id: userId,
          },
        },
        newsfeed: {
          connect: {
            id: newsfeedId,
          },
        },
      },
    );

    return newsfeedLike;
  }

  async delete(userId: string, newsfeedId: string) {
    await this.newsfeedService.validatePermission(userId, newsfeedId);

    const deletedNewsfeedLike = await this.newsfeedLikeRepository.delete({
      newsfeedId_userId: {
        newsfeedId,
        userId,
      },
    });

    return deletedNewsfeedLike;
  }
}
