import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { NestMinioModule } from 'nestjs-minio';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
    NestMinioModule.register({
      endPoint: process.env.MINIO_URL,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      isGlobal: true,
    }),
  ],
  exports: [],
  controllers: [StorageController],
})
export class StorageModule {}
