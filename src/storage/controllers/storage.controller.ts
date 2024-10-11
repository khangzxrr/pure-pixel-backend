import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { StorageService } from '../services/storage.service';
import {
  GetBucketPolicyCommand,
  ListBucketsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiTags } from '@nestjs/swagger';
@Controller('storage')
@ApiTags('storage')
export class StorageController {
  constructor(@Inject() private readonly storageService: StorageService) {}

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
    return await this.storageService.grantObjectPublicReadAccess(key);
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

  @Get('/bucket/policy')
  @Public()
  async setBucketPolicy() {
    const policy = {
      Version: '2008-10-17',
      Id: 'PolicyForCloudFrontPrivateContent',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipal',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: 's3:GetObject',
          Resource: 'arn:aws:s3:::*',
          Condition: {
            StringEquals: {
              'AWS:SourceArn':
                'arn:aws:cloudfront::975050314545:distribution/E90LKADP3UMMC',
            },
          },
        },
      ],
    };

    const buckets = await this.storageService.getS3().send(
      new PutBucketPolicyCommand({
        Bucket: process.env.S3_BUCKET,
        Policy: JSON.stringify(policy),
      }),
    );

    console.log(policy);
  }

  @Get('/object/:key/sign')
  @Public()
  async getObject(@Param('key') key: string) {
    return await this.storageService.signUrlByCloudfront(key);
  }

  @Get('/bucket/:id/policy')
  @Public()
  async getBucketPolicy(@Param('id') id: string) {
    try {
      const cloudfrontPolicy = {
        Version: '2012-10-17',
        Statement: {
          Sid: 'AllowCloudFrontServicePrincipalReadOnly',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:*'],
          Resource: 'arn:aws:s3:::sftpgo/*',
          Condition: {
            StringLike: {
              'aws:Referer': '9vzeMAVjTKCWXjbBNFsCnNRsPKqMYk6achgLXu5S',
            },
          },
        },
      };

      const buckets = await this.storageService.getS3().send(
        new PutBucketPolicyCommand({
          Bucket: id,
          Policy: JSON.stringify(cloudfrontPolicy),
        }),
      );

      const policy = await this.storageService.getS3().send(
        new GetBucketPolicyCommand({
          Bucket: id,
        }),
      );

      console.log(policy);

      return buckets;
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
