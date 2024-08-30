import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { StorageService } from './services/storage.service';
import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Controller('storage')
export class StorageController {
  constructor(@Inject() private readonly storageService: StorageService) {}

  @Get()
  @Public()
  getStorage() {
    return this.storageService.getS3();
  }

  @Get('/presignedPutObject')
  @Public()
  async getPutObjectPresignedUrl(): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Key: 'test.txt',
        Bucket: 'sftpgo',
      });

      const presignedUrl = await getSignedUrl(
        this.storageService.getS3(),
        command,
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
      //     const buckets = await this.minioClient.listBuckets();

      const buckets = await this.storageService
        .getS3()
        .send(new ListBucketsCommand());

      return buckets;
    } catch (e) {
      console.log(e);
    }
  }
}
