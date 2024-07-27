import { Bucket } from '@aws-sdk/client-s3';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectS3, S3 } from 'nestjs-s3';

@Controller('storage')
export class StorageController {

  constructor(
    @InjectS3() private readonly s3: S3,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  @Get()
  getStorage(): string {
    return 'hello storage';
  }

  @Get('/redis')
  async getRedis(): Promise<string> {

    const value = await this.cacheManager.get<string>('test');

    if (value == undefined) {
      await this.cacheManager.set('test', 'value');

      console.log('put in cache');
    }
    console.log(value);

    return value;
  }

  @Get('/buckets')
  async getBuckets(): Promise<Bucket[]> {
    try {
      const list = await this.s3.listBuckets({});

      return list.Buckets
    } catch (e) {
      console.log(e);
    }

  }


}
