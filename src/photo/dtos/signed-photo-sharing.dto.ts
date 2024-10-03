import { ApiProperty } from '@nestjs/swagger';
import { PhotoDto } from './photo.dto';
import { Type } from 'class-transformer';

export class SignedPhotoSharingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  watermark: boolean;

  @ApiProperty()
  quality: string;

  @ApiProperty()
  sharedPhotoUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  @Type(() => PhotoDto)
  originalPhoto: PhotoDto;
}
