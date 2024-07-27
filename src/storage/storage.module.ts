import { Module } from '@nestjs/common';
import { S3Module } from 'nestjs-s3';
import { StorageController } from './storage.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
    S3Module.forRootAsync({
      useFactory: () => ({
        config: {
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY,
            secretAccessKey: process.env.MINIO_SECRET_KEY,
          },
          region: 'us-east-1',
          endpoint: process.env.MINIO_URL,
          forcePathStyle: true,

        },
      })
    })
  ],
  providers: [
  ],
  exports: [],
  controllers: [StorageController],
})
export class StorageModule { }
