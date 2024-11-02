import { Inject, Injectable } from '@nestjs/common';
import { NewsfeedCommentRepository } from 'src/database/repositories/newsfeed-comment.repositort';
import { NewsfeedCommentCreateDto } from '../dtos/newsfeed-comment.create.dto';
import { NewsfeedRepository } from 'src/database/repositories/newsfeed.repository';

import { plainToInstance } from 'class-transformer';
import { NewsfeedCommentDto } from '../dtos/newsfeed-comment.dto';
import { NewsfeedCommentFindAllDto } from '../dtos/rest/newsfeed-comment-find-all.request.dto';
import { NewsfeedCommentUpdateDto } from '../dtos/newsfeed-comment.update.dto';
import { NewsfeedService } from './newsfeed.service';

@Injectable()
export class NewsfeedCommentService {
  constructor(
    @Inject() private readonly newsfeedRepository: NewsfeedRepository,
    @Inject()
    private readonly newsfeedCommentRepository: NewsfeedCommentRepository,
    @Inject()
    private readonly newsfeedService: NewsfeedService,
  ) {}

  async update(
    userId: string,
    newsfeedId: string,
    commentId: string,
    updateDto: NewsfeedCommentUpdateDto,
  ) {
    await this.newsfeedService.validatePermission(userId, newsfeedId);

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
    await this.newsfeedService.validatePermission(userId, newsfeedId);

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
    await this.newsfeedService.validatePermission(userId, newsfeedId);

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
    await this.newsfeedService.validatePermission(userId, newsfeedId);

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
    await this.newsfeedService.validatePermission(userId, newsfeedId);

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
