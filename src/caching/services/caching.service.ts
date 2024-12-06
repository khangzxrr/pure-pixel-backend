import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string) {
    return await this.cache.get<T>(key);
  }

  async set(key: string, value: unknown) {
    return await this.cache.set(key, value);
  }

  async del(key: string) {
    return this.cache.del(key);
  }

  async deleteWithPattern(pattern: string) {
    const keys = await this.cache.store.keys(pattern);

    for (let key of keys) {
      await this.cache.del(key);
    }
  }
}
