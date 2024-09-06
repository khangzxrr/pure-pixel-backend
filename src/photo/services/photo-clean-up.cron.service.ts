import { Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

export class PhotoCleanUpCronService {
  private readonly logger = new Logger(PhotoCleanUpCronService.name);

  constructor(@Inject() private readonly photoRepository: PhotoRepository) {}

  //clean up pending upload
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    try {
      //delete by one day passed
      const result = await this.photoRepository.deleteByExpiredUploadDate(
        new Date(),
        1,
      );
      this.logger.log(`delete ${result.count} expired upload photos`);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
