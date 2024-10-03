import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore as unknown as CacheStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
      ttl: 86400000,
    }),
  ],

  exports: [CacheModule],
})
export class CachingModule {}
