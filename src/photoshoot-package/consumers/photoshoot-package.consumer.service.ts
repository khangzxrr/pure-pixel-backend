import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoshootPackageConstant } from '../constants/photoshoot-package.constant';
import { Job, Queue } from 'bullmq';
import { v4 } from 'uuid';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { rm, rmSync } from 'fs';

@Processor(PhotoshootPackageConstant.PHOTOSHOOT_PACKAGE_QUEUE, {
  concurrency: 6,
})
export class PhotoshootPackageConsumerService extends WorkerHost {
  private readonly logger = new Logger(PhotoshootPackageConsumerService.name);
  constructor(
    @Inject()
    private readonly photoshootRepository: PhotoshootRepository,
    @Inject()
    private readonly photoProcessService: PhotoProcessService,
    @InjectQueue(PhotoshootPackageConstant.PHOTOSHOOT_PACKAGE_QUEUE)
    private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    try {
      switch (job.name) {
        case PhotoshootPackageConstant.UPLOAD_TO_CLOUD:
          await this.uploadToCloud(job.data.photoshootPackageId);
          break;
        case PhotoshootPackageConstant.DELETE_TEMPORARY_PHOTO:
          this.deleteFileSystemPhoto(job.data.path);
          break;
        default:
          break;
      }
    } catch (e) {
      console.log(e);
      throw new Error();
    }
  }

  deleteFileSystemPhoto(path: string) {
    rmSync(path);

    this.logger.log(`delete photo shoot temporary photo: ${path}`);
  }

  async uploadToCloud(photoshootPackageId: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    const temporaryPhotoPaths: string[] = [];

    if (photoshootPackage.sourceStatus === 'CLOUD') {
      this.logger.log(
        `photoshoot package ${photoshootPackageId} is uploaded to cloud, skip`,
      );
      return;
    }

    temporaryPhotoPaths.push(photoshootPackage.thumbnail);
    photoshootPackage.showcases.forEach((showcase) => {
      temporaryPhotoPaths.push(showcase.photoUrl);
    });

    const thumbnailKey = `photoshoot_thumbnail/${v4()}.webp`;

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      photoshootPackage.thumbnail,
    );

    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);
    await this.photoProcessService.uploadFromBuffer(
      thumbnailKey,
      thumbnailBuffer,
    );

    const showcaseKeysPromises = photoshootPackage.showcases.map(
      async (showcase) => {
        const showcaseKey = `photoshoot_showcase/${v4()}.webp`;

        const showcaseSharp =
          await this.photoProcessService.sharpInitFromFilePath(
            showcase.photoUrl,
          );
        const showcaseThumbnailBuffer =
          await this.photoProcessService.makeThumbnail(showcaseSharp);
        await this.photoProcessService.uploadFromBuffer(
          showcaseKey,
          showcaseThumbnailBuffer,
        );

        return showcaseKey;
      },
    );

    const showcaseKeys = await Promise.all(showcaseKeysPromises);

    await this.photoshootRepository.updateById(photoshootPackageId, {
      thumbnail: thumbnailKey,
      sourceStatus: 'CLOUD',
      showcases: {
        deleteMany: {},
        create: showcaseKeys.map((showcase) => {
          return {
            photoUrl: showcase,
          };
        }),
      },
    });

    this.logger.log(
      `uploaded photoshoot package id: ${photoshootPackageId} to cloud`,
    );

    const queueCommands = temporaryPhotoPaths.map((p) => {
      return {
        name: PhotoshootPackageConstant.DELETE_TEMPORARY_PHOTO,
        data: {
          path: p,
        },
        opts: {
          delay: 3000,
        },
      };
    });
    this.queue.addBulk(queueCommands);
  }
}
