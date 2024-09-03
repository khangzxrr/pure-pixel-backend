import { ApiProperty } from '@nestjs/swagger';

export class SignedUpload {
  @ApiProperty({
    description: 'upload file name in local',
  })
  filename: string;
  @ApiProperty({ description: 'S3 presigned upload url' })
  uploadUrl: string;
  @ApiProperty({
    description: 'object path in S3 bucket',
  })
  storageObject: string;
  @ApiProperty({
    description: 'photo id in database',
  })
  photoId: string;

  constructor(name: string, url: string, object: string, photoId: string = '') {
    this.filename = name;
    this.uploadUrl = url;
    this.storageObject = object;
    this.photoId = photoId;
  }
}

export class PresignedUploadUrlResponse {
  @ApiProperty({ type: SignedUpload })
  signedUploads: SignedUpload[];

  constructor(urls: SignedUpload[]) {
    this.signedUploads = urls;
  }
}
