import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsNotEmpty, IsString } from 'class-validator';

export class PhotoshootPackageDetailReplaceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    isArray: true,
    type: String,
  })
  @ArrayNotEmpty()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  descriptions: string[];
}
