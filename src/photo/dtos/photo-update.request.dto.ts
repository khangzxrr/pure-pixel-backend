import { ApiProperty } from '@nestjs/swagger';
import { PhotoDto } from './photo.dto';
import { ArrayNotEmpty, IsArray } from 'class-validator';

export class PhotoUpdateRequest {
  @ApiProperty({
    type: PhotoDto,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  photos: PhotoDto[];
}
