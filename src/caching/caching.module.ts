import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { CachingService } from './services/caching.service';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore as unknown as CacheStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
      ttl: 300000,
    }),
  ],
  providers: [CachingService],

  exports: [CacheModule, CachingService],
})
export class CachingModule {}
