import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { StorageService } from './services/storage.service';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
  ],
  exports: [],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
