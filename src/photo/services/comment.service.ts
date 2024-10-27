import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from 'src/database/repositories/comment.repository';
import { CreateCommentRequestDto } from '../dtos/rest/create-comment.request.dto';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { Photo } from '@prisma/client';
import { CommentEntity } from '../entities/comment.entity';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { CommentDto } from '../dtos/comment-dto';
import { UpdateCommentRequestDto } from '../dtos/rest/update-comment.request.dto';

@Injectable()
export class CommentService {
  constructor(
    @Inject() private readonly commentRepository: CommentRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {}

  async validatePhotoByIdAndVisibility(
    photoId: string,
    userId: string,
  ): Promise<Photo> {
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (photo.visibility === 'PRIVATE' && userId !== photo.photographerId) {
      throw new PhotoIsPrivatedException();
    }

    return photo;
  }

  async findAllByPhotoId(photoId: string, userId: string) {
    const photo = await this.validatePhotoByIdAndVisibility(photoId, userId);

    const comments = await this.commentRepository.findAllParentCommentByPhotoId(
      photo.id,
    );

    return plainToInstance(CommentDto, comments);
  }

  async findAllReplies(photoId: string, userId: string, commentId: string) {
    await this.validatePhotoByIdAndVisibility(photoId, userId);

    const replies =
      await this.commentRepository.findReplyByCommentId(commentId);

    return plainToInstance(CommentDto, replies);
  }

  async deleteComment(photoId: string, userId: string, commentId: string) {
    await this.validatePhotoByIdAndVisibility(photoId, userId);

    const comment = await this.commentRepository.findUniqueOrThrow({
      photoId,
      userId,
      id: commentId,
    });

    const deletedComment = await this.commentRepository.delete({
      photoId,
      userId,
      id: comment.id,
    });

    return plainToInstance(CommentDto, deletedComment);
  }

  async updateComment(
    photoId: string,
    userId: string,
    commentId: string,
    updateDto: UpdateCommentRequestDto,
  ) {
    await this.validatePhotoByIdAndVisibility(photoId, userId);

    const comment = await this.commentRepository.findUniqueOrThrow({
      photoId,
      userId,
      id: commentId,
    });

    const updatedComment = await this.commentRepository.update({
      data: {
        content: updateDto.content,
      },
      where: {
        id: comment.id,
      },
    });

    return plainToInstance(CommentDto, updatedComment);
  }

  async createReply(
    photoId: string,
    userId: string,
    commentId: string,
    createCommentRequestDto: CreateCommentRequestDto,
  ): Promise<CommentDto> {
    const photo = await this.validatePhotoByIdAndVisibility(photoId, userId);

    const parentComment = await this.commentRepository.findUniqueOrThrow({
      id: commentId,
      photoId,
      userId,
    });

    const comment = new CommentEntity({
      content: createCommentRequestDto.content,
      userId: userId,
      photoId: photo.id,
      parentId: commentId,
    });

    const notificationDto: NotificationCreateDto = {
      userId: photo.photographerId,
      title: 'Bình luận mới!',
      content: `Ảnh ${photo.title} của bạn vừa nhận được một bình luận mới!`,
      referenceType: 'PHOTO',
      referenceId: photoId,
      type: 'IN_APP',
    };

    const notificationReplyDto: NotificationCreateDto = {
      userId: parentComment.userId,
      title: 'Bình luận của bạn nhận được phản hồi mới!',
      content: `Bình luận của bạn ở ảnh ${photo.title} vừa nhận được một phản hồi mới!`,
      referenceType: 'PHOTO',
      referenceId: photoId,
      type: 'IN_APP',
    };

    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationDto,
    );
    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationReplyDto,
    );

    const createdComment = await this.commentRepository.createComment(comment);

    return plainToInstance(CommentDto, createdComment);
  }

  async createComment(
    photoId: string,
    userId: string,
    createCommentRequestDto: CreateCommentRequestDto,
  ): Promise<CommentDto> {
    const photo = await this.validatePhotoByIdAndVisibility(photoId, 'PUBLIC');

    const comment = new CommentEntity({
      content: createCommentRequestDto.content,
      userId: userId,
      photoId: photo.id,
    });

    const notificationDto: NotificationCreateDto = {
      userId: photo.photographerId,
      title: 'Bình luận mới!',
      content: `Ảnh ${photo.title} của bạn vừa nhận được một bình luận mới!`,
      referenceType: 'PHOTO',
      referenceId: photoId,
      type: 'IN_APP',
    };
    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationDto,
    );

    const createdComment = await this.commentRepository.createComment(comment);

    return plainToInstance(CommentDto, createdComment);
  }
}
