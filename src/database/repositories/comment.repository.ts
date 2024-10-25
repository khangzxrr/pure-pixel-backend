import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUniqueOrThrow(id: string) {
    return this.prisma.comment.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  async findReplyByCommentId(commentId: string) {
    return this.prisma.comment.findMany({
      where: {
        parentId: commentId,
      },
      include: {
        user: true,
        replies: {
          select: {
            id: true,
            user: true,
            content: true,
            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllParentCommentByPhotoId(photoId: string) {
    return this.prisma.comment.findMany({
      where: {
        photoId,
        parentId: null,
      },
      include: {
        user: true,
        replies: {
          select: {
            id: true,
            user: true,
            content: true,
            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
      },
    });
  }

  async createComment(comment: Comment) {
    return this.prisma.comment.create({
      data: comment,
    });
  }
}
