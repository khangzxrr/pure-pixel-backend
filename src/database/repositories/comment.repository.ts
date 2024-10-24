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

  async findAllCommentByPhotoId(photoId: string) {
    return this.prisma.comment.findMany({
      where: {
        photoId,
      },
      include: {
        user: true,
        replies: true,
      },
    });
  }

  async createComment(comment: Comment) {
    return this.prisma.comment.create({
      data: comment,
    });
  }
}
