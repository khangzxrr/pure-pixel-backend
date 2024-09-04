import {
  GetObjectAclCommand,
  GetObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
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

  async getPresignedUploadUrl(key: string) {
    const command = new PutObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
      ACL: 'private',
    });

    const signedUrl = await getSignedUrl(this.getS3(), command, {});

    return signedUrl;
  }

  async uploadFromBytes(key: string, bytes) {
    const command = new PutObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
      ACL: 'private',
      Body: bytes,
    });

    const result = await this.sendCommand(command);

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
