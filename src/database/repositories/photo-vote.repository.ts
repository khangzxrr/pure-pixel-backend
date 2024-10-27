import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoVoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  delete(voteId: string, photoId: string, userId: string) {
    return this.prisma.vote.delete({
      where: {
        id: voteId,
        photoId,
        userId,
      },
    });
  }

  findFirst(userId: string, photoId: string) {
    return this.prisma.vote.findUnique({
      where: {
        userId_photoId: {
          userId,
          photoId,
        },
      },
    });
  }

  vote(userId: string, isUpvote: boolean, photoId: string) {
    return this.prisma.vote.upsert({
      where: {
        userId_photoId: {
          userId,
          photoId,
        },
      },
      update: {
        isUpvote,
      },
      create: {
        photo: {
          connect: {
            id: photoId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        isUpvote,
      },
    });
  }
}
