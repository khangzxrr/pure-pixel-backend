import { Injectable } from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUniqueOrThrow(where: Prisma.CommentWhereUniqueInput) {
    return this.prisma.comment.findUniqueOrThrow({
      where,
    });
  }

  async delete(where: Prisma.CommentWhereUniqueInput) {
    return this.prisma.comment.delete({
      where,
    });
  }

  async update(args: Prisma.CommentUpdateArgs) {
    return this.prisma.comment.update(args);
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
            createdAt: true,
            updatedAt: true,
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
            createdAt: true,
            updatedAt: true,
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
