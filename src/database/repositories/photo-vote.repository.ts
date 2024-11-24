import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoVoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  aggregate(where: Prisma.VoteWhereInput) {
    return this.prisma.vote.aggregate({
      where,
      _count: {
        id: true,
      },
    });
  }

  delete(photoId: string, userId: string) {
    return this.prisma.vote.delete({
      where: {
        userId_photoId: {
          userId,
          photoId,
        },
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
