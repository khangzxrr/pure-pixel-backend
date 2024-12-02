import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { PhotoVoteDto } from '../dtos/photo-vote.dto';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoVoteRequestDto } from '../dtos/rest/photo-vote.request.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PhotoVoteRepository } from 'src/database/repositories/photo-vote.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

@Injectable()
export class PhotoVoteService {
  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoVoteRepository: PhotoVoteRepository,
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async getVote(userId: string, photoId: string) {
    const vote = await this.photoVoteRepository.findFirst(userId, photoId);

    return plainToInstance(PhotoVoteDto, vote);
  }

  async vote(
    userId: string,
    photoId: string,
    photoVoteRequestDto: PhotoVoteRequestDto,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    const vote = await this.photoVoteRepository.vote(
      userId,
      photoVoteRequestDto.isUpvote,
      photoId,
    );

    // const notificationDto: NotificationCreateDto = {
    //   userId: photo.photographerId,
    //   title: 'Tương tác mới',
    //   content: `Ảnh ${photo.title} của bạn vừa nhận được một đánh giá!`,
    //   referenceType: 'PHOTO',
    //   payload: {},
    //   type: 'IN_APP',
    // };
    // await this.notificationQueue.add(
    //   NotificationConstant.TEXT_NOTIFICATION_JOB,
    //   notificationDto,
    // );

    return plainToInstance(PhotoVoteDto, vote);
  }

  async deleteVote(userId: string, photoId: string) {
    const existVote = await this.photoVoteRepository.findFirst(userId, photoId);

    if (!existVote) return;

    const deletedPhoto = await this.photoVoteRepository.delete(photoId, userId);

    return plainToInstance(PhotoDto, deletedPhoto);
  }
}
