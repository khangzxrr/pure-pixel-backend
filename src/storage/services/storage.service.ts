import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
@Injectable()
export class StorageService {
  getS3() {
    console.log(process.env.S3_ACCESS_KEY_ID);

    return new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_URL,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
}
