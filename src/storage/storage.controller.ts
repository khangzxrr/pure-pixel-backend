import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { Client } from 'minio';

@Controller('storage')
export class StorageController {
  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}
  @Get()
  getStorage(): string {
    return 'hello storage';
  }

  @Get('/presignedPutObject')
  @Public()
  async getPutObjectPresignedUrl(): Promise<string> {
    try {
      const presignedUrl = await this.minioClient.presignedPutObject(
        'upload',
        'abc.test',
      );

      return presignedUrl;
    } catch (e) {
      console.log(e);
    }
  }

  @Get('/buckets')
  @Public()
  async getBuckets() {
    try {
      const buckets = await this.minioClient.listBuckets();

      return buckets;
    } catch (e) {
      console.log(e);
    }
  }
}
