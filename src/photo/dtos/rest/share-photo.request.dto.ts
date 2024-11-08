import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PhotoSizeDto } from '../photo-size.dto';
import { Type } from 'class-transformer';

export class SharePhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty()
  @Type(() => PhotoSizeDto)
  size: PhotoSizeDto;
}
