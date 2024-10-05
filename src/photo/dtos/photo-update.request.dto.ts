import { ApiProperty } from '@nestjs/swagger';
import { PhotoDto } from './photo.dto';
import { ArrayNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class PhotoUpdateRequest {
  @ApiProperty({
    type: PhotoDto,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => PhotoDto)
  photos: PhotoDto[];
}
