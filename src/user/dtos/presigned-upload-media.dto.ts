import { ApiProperty } from '@nestjs/swagger';

export class PresignedUploadMediaDto {
  @ApiProperty()
  avatarUploadUrl: string;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty()
  coverUploadUrl: string;

  @ApiProperty()
  coverUrl: string;

  constructor(
    avatarUrl: string,
    coverUrl: string,
    avatarUploadUrl: string,
    coverUploadUrl: string,
  ) {
    this.avatarUrl = avatarUrl;
    this.coverUrl = coverUrl;
    this.avatarUploadUrl = avatarUploadUrl;
    this.coverUploadUrl = coverUploadUrl;
  }
}
