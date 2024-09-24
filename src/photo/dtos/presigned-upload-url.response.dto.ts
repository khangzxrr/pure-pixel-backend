import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignedUpload {
  @ApiProperty({
    description: 'upload file name in local',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'S3 presigned upload url' })
  @IsString()
  @IsNotEmpty()
  uploadUrl: string;

  @ApiProperty({
    description: 'object path in S3 bucket',
  })
  @IsString()
  @IsNotEmpty()
  storageObject: string;

  @ApiProperty({
    description: 'photo id in database',
  })
  @IsString()
  @IsNotEmpty()
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
  signedUpload: SignedUpload;

  constructor(signedUpload: SignedUpload) {
    this.signedUpload = signedUpload;
  }
}
