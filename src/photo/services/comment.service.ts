import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from 'src/database/repositories/comment.repository';
import { CreateCommentRequestDto } from '../dtos/rest/create-comment.request.dto';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { Photo, PhotoVisibility } from '@prisma/client';
import { CommentEntity } from '../entities/comment.entity';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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
    visibility: PhotoVisibility,
  ): Promise<Photo> {
    const photo = await this.photoRepository.getPhotoById(photoId);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (photo.visibility != visibility) {
      throw new PhotoIsPrivatedException();
    }

    return photo;
  }

  async findAllByPhotoId(photoId: string) {
    const photo = await this.validatePhotoByIdAndVisibility(photoId, 'PUBLIC');

    const comments = await this.commentRepository.findAllCommentByPhotoId(
      photo.id,
    );

    return comments.map((c) => new CommentEntity(c));
  }

  async createComment(
    photoId: string,
    userId: string,
    createCommentRequestDto: CreateCommentRequestDto,
  ): Promise<CommentEntity> {
    const photo = await this.validatePhotoByIdAndVisibility(photoId, 'PUBLIC');

    const comment = new CommentEntity({
      content: createCommentRequestDto.content,
      userId: userId,
      photoId: photo.id,
    });

    const notificationDto: NotificationCreateDto = {
      userId,
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

    return await this.commentRepository.createComment(comment);
  }
}
