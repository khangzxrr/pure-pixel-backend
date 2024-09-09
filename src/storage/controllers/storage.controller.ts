import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { StorageService } from '../services/storage.service';
import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiTags } from '@nestjs/swagger';

@Controller('storage')
@ApiTags('storage')
export class StorageController {
  constructor(@Inject() private readonly storageService: StorageService) {}

  @Get()
  @Public()
  getStorage() {
    return this.storageService.getS3();
  }

  @Get('/cors')
  @Public()
  async getBucketCors() {
    return await this.storageService.getBucketCors();
  }

  @Get('/cors/set')
  @Public()
  async setBucketCors() {
    return await this.storageService.setBucketCors();
  }
  @Get('/object/:key/grant-public')
  @Public()
  async grantPublicAccess(@Param('key') key: string) {
    return await this.storageService.grantObjectPublicAccess(key);
  }

  @Get('/object/:key/acl')
  @Public()
  async getObjectAcl(@Param('key') key: string) {
    return await this.storageService.getObjectAcl(key);
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
