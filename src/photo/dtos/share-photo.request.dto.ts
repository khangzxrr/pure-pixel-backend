import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SharePhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resolution: string;

  // @ApiProperty()
  // @IsBoolean()
  // @ToBoolean()
  // @IsNotEmpty()
  // watermark: boolean;
}
