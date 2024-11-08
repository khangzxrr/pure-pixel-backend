import { ApiProperty } from '@nestjs/swagger';
import { PhotoSizeDto } from '../photo-size.dto';
import { Type } from 'class-transformer';

export class SharePhotoResponseDto {
  @ApiProperty()
  @Type(() => PhotoSizeDto)
  size: PhotoSizeDto;

  @ApiProperty()
  shareUrl: string;

  constructor(size: PhotoSizeDto, shareUrl: string) {
    this.shareUrl = shareUrl;
    this.size = size;
  }
}
