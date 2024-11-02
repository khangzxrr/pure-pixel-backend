import { Inject, Injectable } from '@nestjs/common';
import { NewsfeedCommentRepository } from 'src/database/repositories/newsfeed-comment.repositort';
import { NewsfeedCommentCreateDto } from '../dtos/newsfeed-comment.create.dto';
import { NewsfeedRepository } from 'src/database/repositories/newsfeed.repository';
import { InsufficientPermissionToPerformOnNewsfeedException } from '../exceptions/insufficient-permission-to-perform-on-newsfeed.exception';

import { plainToInstance } from 'class-transformer';
import { NewsfeedCommentDto } from '../dtos/newsfeed-comment.dto';
import { NewsfeedCommentFindAllDto } from '../dtos/rest/newsfeed-comment-find-all.request.dto';
import { NewsfeedCommentUpdateDto } from '../dtos/newsfeed-comment.update.dto';

@Injectable()
export class NewsfeedCommentService {
  constructor(
    @Inject() private readonly newsfeedRepository: NewsfeedRepository,
    @Inject()
    private readonly newsfeedCommentRepository: NewsfeedCommentRepository,
  ) {}

  async validatePermission(userId: string, newsfeedId: string) {
    const newsfeedCount = await this.newsfeedRepository.count({
      id: newsfeedId,
      AND: [
        {
          permissions: {
            none: {
              userId,
              permission: 'DENY',
            },
          },
        },
      ],
      OR: [
        {
          visibility: 'PUBLIC',
        },
        {
          visibility: 'ONLY_ME',
          userId,
        },
        {
          visibility: 'ONLY_CHOOSED',
          OR: [
            { userId },
            {
              permissions: {
                some: {
                  userId,
                  permission: 'ALLOW',
                },
              },
            },
          ],
        },
        {
          visibility: 'ONLY_FOLLOWING',
          OR: [
            { userId },
            {
              user: {
                followers: {
                  some: {
                    followerId: userId,
                  },
                },
              },
            },
          ],
        },
      ],
    });

    if (newsfeedCount <= 0) {
      throw new InsufficientPermissionToPerformOnNewsfeedException();
    }
  }

  async update(
    userId: string,
    newsfeedId: string,
    commentId: string,
    updateDto: NewsfeedCommentUpdateDto,
  ) {
    await this.validatePermission(userId, newsfeedId);

    const updatedComment = await this.newsfeedCommentRepository.update(
      {
        userId,
        id: commentId,
        newsfeedId,
      },
      {
        content: updateDto.content,
      },
    );

    return plainToInstance(NewsfeedCommentDto, updatedComment);
  }

  async create(
    userId: string,
    newsfeedId: string,
    createDto: NewsfeedCommentCreateDto,
  ) {
    await this.validatePermission(userId, newsfeedId);

    const newsfeedComment = await this.newsfeedCommentRepository.create({
      newsfeed: {
        connect: {
          id: newsfeedId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      content: createDto.content,
    });

    return plainToInstance(NewsfeedCommentDto, newsfeedComment);
  }

  async reply(
    userId: string,
    newsfeedId: string,
    commentId: string,
    createDto: NewsfeedCommentCreateDto,
  ) {
    await this.validatePermission(userId, newsfeedId);

    const newsfeedComment = await this.newsfeedCommentRepository.create({
      newsfeed: {
        connect: {
          id: newsfeedId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      parent: {
        connect: {
          id: commentId,
        },
      },
      content: createDto.content,
    });

    return plainToInstance(NewsfeedCommentDto, newsfeedComment);
  }

  async delete(userId: string, newsfeedId: string, commentId: string) {
    await this.validatePermission(userId, newsfeedId);

    const deletedComment = await this.newsfeedCommentRepository.delete({
      userId,
      id: commentId,
      newsfeedId,
    });

    return plainToInstance(NewsfeedCommentDto, deletedComment);
  }

  async findMany(
    userId: string,
    newsfeedId: string,
    findAllDto: NewsfeedCommentFindAllDto,
    parentId?: string,
  ) {
    await this.validatePermission(userId, newsfeedId);

    const comments = await this.newsfeedCommentRepository.findMany(
      {
        newsfeedId,
        parentId,
      },
      {
        user: true,
        _count: {
          select: {
            replies: true,
          },
        },
        replies: {
          include: {
            user: true,

            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
      },
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    return plainToInstance(NewsfeedCommentDto, comments);
  }
}
