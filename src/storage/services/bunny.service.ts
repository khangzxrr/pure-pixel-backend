import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileShouldNotBeNullException } from '../exceptions/file-should-not-be-null.exception';
import { v4 } from 'uuid';
import { Utils } from 'src/infrastructure/utils/utils';

//storage used to be Bunny CDN, it is now any S3 compatible store (MinIO)
//method signatures are kept so callers do not change
@Injectable()
export class BunnyService {
  //created lazily by getS3()
  private s3?: S3Client;

  private getS3() {
    if (this.s3) {
      return this.s3;
    }

    this.s3 = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: this.getRegion(),
      forcePathStyle: true,
      credentials: {
        accessKeyId: Utils.env('STORAGE_ACCESS_KEY'),
        secretAccessKey: Utils.env('STORAGE_SECRET_KEY'),
      },
    });

    return this.s3;
  }

  private getRegion() {
    return process.env.STORAGE_REGION ?? 'us-east-1';
  }

  private normalizeKey(key: string) {
    return key.replace(/^\/+/, '');
  }

  private async putObject(
    bucket: string | undefined,
    key: string,
    body: Buffer,
  ) {
    await this.getS3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: this.normalizeKey(key),
        Body: body,
      }),
    );
  }

  async delete(key: string) {
    if (key == null) {
      throw new FileShouldNotBeNullException();
    }

    return await this.getS3().send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: this.normalizeKey(key),
      }),
    );
  }

  async download(key: string) {
    if (key == null) {
      throw new FileShouldNotBeNullException();
    }

    const response = await this.getS3().send(
      new GetObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: this.normalizeKey(key),
      }),
    );

    //a successful GetObject always carries a body
    if (!response.Body) {
      throw new Error(`object ${key} has no body`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async uploadFromBuffer(key: string, buffer: Buffer) {
    if (key == null || buffer == null) {
      throw new FileShouldNotBeNullException();
    }

    await this.putObject(process.env.STORAGE_BUCKET, key, buffer);

    return key;
  }

  //there is no CDN cache in front of the object store
  async pruneCache(_url: string) {}

  async uploadPublicFromBuffer(buffer: Buffer, filekey: string) {
    if (buffer === null) {
      throw new FileShouldNotBeNullException();
    }

    await this.putObject(process.env.STORAGE_PUBLIC_BUCKET, filekey, buffer);

    return this.getPublicUrl(filekey);
  }

  async uploadPublic(file: MemoryStoredFile, filekey: string) {
    if (file === null) {
      throw new FileShouldNotBeNullException();
    }

    await this.putObject(
      process.env.STORAGE_PUBLIC_BUCKET,
      filekey,
      file.buffer,
    );

    return this.getPublicUrl(filekey);
  }

  async upload(file: MemoryStoredFile) {
    if (file === null) {
      throw new FileShouldNotBeNullException();
    }

    const filekey = `${v4()}.${file.extension}`;

    await this.putObject(process.env.STORAGE_BUCKET, filekey, file.buffer);

    return filekey;
  }

  private getPublicUrl(filekey: string) {
    return `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_PUBLIC_BUCKET}/${this.normalizeKey(filekey)}`;
  }

  //query used to carry Bunny optimizer params (width) and cache busters (updatedAt)
  //S3 cannot resize and extra params would invalidate the signature, so it is ignored
  //signing is done by hand (SigV4 query presign) because callers expect a sync result
  getPresignedFile(filename: string, _query: string = '') {
    const publicUrl = new URL(Utils.env('STORAGE_PUBLIC_URL'));
    const region = this.getRegion();
    const accessKey = process.env.STORAGE_ACCESS_KEY;

    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const scope = `${dateStamp}/${region}/s3/aws4_request`;

    const encodedKey = this.normalizeKey(filename)
      .split('/')
      .map((segment) => this.encodeRfc3986(segment))
      .join('/');
    const basePath = publicUrl.pathname.replace(/\/+$/, '');
    const canonicalUri = `${basePath}/${process.env.STORAGE_BUCKET}/${encodedKey}`;

    const params: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${accessKey}/${scope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': '3600',
      'X-Amz-SignedHeaders': 'host',
    };
    const canonicalQuery = Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${this.encodeRfc3986(key)}=${this.encodeRfc3986(params[key])}`,
      )
      .join('&');

    const canonicalRequest = [
      'GET',
      canonicalUri,
      canonicalQuery,
      `host:${publicUrl.host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const hmac = (key: crypto.BinaryLike, data: string) =>
      crypto.createHmac('sha256', key).update(data).digest();

    const signingKey = hmac(
      hmac(
        hmac(hmac(`AWS4${process.env.STORAGE_SECRET_KEY}`, dateStamp), region),
        's3',
      ),
      'aws4_request',
    );
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    return `${publicUrl.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  private encodeRfc3986(value: string) {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }

  async bunnyFileList() {
    const response = await this.getS3().send(
      new ListObjectsV2Command({
        Bucket: process.env.STORAGE_BUCKET,
      }),
    );

    return response.Contents ?? [];
  }
}
