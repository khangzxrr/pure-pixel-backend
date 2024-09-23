import {
  GetBucketCorsCommand,
  GetObjectAclCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  PutBucketCorsCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { S3FailedUploadException } from '../exceptions/s3-failed-upload.exception';

@Injectable()
export class StorageService {
  private logger: Logger = new Logger(StorageService.name);

  getS3() {
    return new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_URL,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendCommand(command) {
    return this.getS3().send(command);
  }

  async getSignedGetUrl(key: string) {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
    });

    const signedUrl = await getSignedUrl(this.getS3(), command, {});

    return signedUrl;
  }

  async getBucketCors() {
    const command = new GetBucketCorsCommand({
      Bucket: process.env.S3_BUCKET,
    });

    return await this.sendCommand(command);
  }

  async setBucketCors() {
    const command = new PutBucketCorsCommand({
      Bucket: process.env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['Access-Control-Allow-Origin'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    return await this.sendCommand(command);
  }

  async getPresignedUploadUrl(key: string) {
    const command = new PutObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
      ACL: 'private',
    });

    const signedUrl = await getSignedUrl(this.getS3(), command, {});

    return signedUrl;
  }

  async getObjectHead(key: string): Promise<HeadObjectCommandOutput> {
    const command = new HeadObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
    });

    const result = await this.sendCommand(command);

    return result;
  }

  async uploadFromBytes(key: string, bytes) {
    const command = new PutObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
      ACL: 'private',
      Body: bytes,
    });

    const result = await this.sendCommand(command);

    if (result.$metadata.httpStatusCode != 200) {
      throw new S3FailedUploadException();
    }

    return result;
  }

  async grantObjectPublicAccess(key: string) {
    const command = new PutObjectAclCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
      ACL: 'public-read',
    });

    const response = await this.sendCommand(command);

    return response;
  }

  async getObjectAcl(key: string) {
    const command = new GetObjectAclCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
    });

    const objectAcl = await this.sendCommand(command);

    return objectAcl;
  }
}
