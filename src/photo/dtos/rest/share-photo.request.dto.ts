import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PhotoSizeDto } from '../photo-size.dto';
import { Type } from 'class-transformer';

export class SharePhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty({
    type: PhotoSizeDto,
  })
  @Type(() => PhotoSizeDto)
  @ValidateNested()
  size: PhotoSizeDto;
}
