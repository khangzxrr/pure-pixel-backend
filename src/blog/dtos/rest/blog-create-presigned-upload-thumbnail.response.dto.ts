import { ApiProperty } from '@nestjs/swagger';

export class BlogCreatePresignedUploadThumbnailDto {
  @ApiProperty()
  presignedUploadUrl: string;

  constructor(presignedUploadUrl: string) {
    this.presignedUploadUrl = presignedUploadUrl;
  }
}
