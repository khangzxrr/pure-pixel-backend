import {
  DeleteObjectsCommand,
  GetBucketCorsCommand,
  GetObjectAclCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ObjectCannedACL,
  PutBucketCorsCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getSignedUrl as getSignedUrlByCloudfront } from '@aws-sdk/cloudfront-signer';

import { Injectable, Logger } from '@nestjs/common';
import { S3FailedUploadException } from '../exceptions/s3-failed-upload.exception';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';

@Injectable()
export class StorageService {
  private logger: Logger = new Logger(StorageService.name);

  private s3: S3Client;
  private cfClient: CloudFrontClient;

  getS3() {
    if (this.s3) {
      return this.s3;
    }

    this.s3 = new S3Client({
      region: process.env.S3_REGION,
      useAccelerateEndpoint: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    return this.s3;
  }

  getCloudfront() {
    if (this.cfClient) {
      return this.cfClient;
    }

    this.cfClient = new CloudFrontClient({});
  }

  async signUrlByCloudfront(key: string) {
    return getSignedUrlByCloudfront({
      url: `${process.env.AWS_CLOUDFRONT_S3_ORIGIN}/${key}`,
      keyPairId: process.env.AWS_CLOUDFRONT_ACCESS_KEY,
      privateKey: process.env.AWS_CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      dateLessThan: '2025-01-01',
    });
  }

  async sendCommand(command) {
    return this.getS3().send(command);
  }

  async getS3SignedUrl(key: string) {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
    });

    return await getSignedUrl(this.getS3(), command, {});
  }

  async signUrlUsingCDN(key: string) {
    // return this.getS3SignedUrl(key);

    return this.signUrlByCloudfront(key);
  }

  async deleteKeys(keys: string[]) {
    const keyToObjIdentifers = keys.map((k) => ({
      Key: k,
    }));

    const command = new DeleteObjectsCommand({
      Bucket: process.env.S3_BUCKET,
      Delete: {
        Objects: keyToObjIdentifers,
      },
    });

    return this.sendCommand(command);
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

  async getPresignedUploadUrl(key: string, ACL: ObjectCannedACL) {
    const command = new PutObjectCommand({
      Key: key,
      ContentType: 'image/jpeg',
      Bucket: process.env.S3_BUCKET,
      ACL,
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

  async grantObjectPublicReadAccess(key: string) {
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
