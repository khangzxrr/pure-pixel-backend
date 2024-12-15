import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BookingConstant } from 'src/booking/constants/booking.constant';
import { CameraConstant } from 'src/camera/constants/camera.constant';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';
import { BullMqConfigService } from 'src/customConfig/services/bullmq-config.service';
import { BullMqQueueRegisterService } from 'src/customConfig/services/bullmq-queue-register.service';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { PhotoConstant } from 'src/photo/constants/photo.constant';
import { PhotoshootPackageConstant } from 'src/photoshoot-package/constants/photoshoot-package.constant';
import { UpgradeConstant } from 'src/upgrade-package/constants/upgrade.constant';

@Module({
  exports: [BullModule],
  imports: [
    //register bullMq and queue need to use async becuz there is a bug when deploy to server
    //queue doesnt use connection of forRootAsync, so we have to registerQueueAsync with provided connection too
    //it will work for every nodejs version and nestjs version too
    BullModule.forRootAsync({
      imports: [CustomConfigModule],
      useExisting: BullMqConfigService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: UpgradeConstant.UPGRADE_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: PhotoConstant.PHOTO_PROCESS_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: PhotoConstant.PHOTO_WATERMARK_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: PhotoConstant.PHOTO_VIEWCOUNT_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: NotificationConstant.NOTIFICATION_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: CameraConstant.CAMERA_PROCESS_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: PhotoshootPackageConstant.PHOTOSHOOT_PACKAGE_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: BookingConstant.BOOKING_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
  ],
})
export class QueueModule {}
