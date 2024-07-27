import { Bucket } from '@aws-sdk/client-s3';
import { Controller, Get } from '@nestjs/common';
import { InjectS3, S3 } from 'nestjs-s3';

@Controller('storage')
export class StorageController {

  constructor(
    @InjectS3() private readonly s3: S3,
  ) { }

  @Get()
  getStorage(): string {
    return 'hello storage';
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
