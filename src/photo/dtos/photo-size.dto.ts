import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PhotoSizeDto {
  @ApiProperty()
  @Type(() => Number)
  width: number;

  @ApiProperty()
  @Type(() => Number)
  height: number;

  @ApiPropertyOptional()
  preview?: string;

  constructor(width: number, height: number, preview?: string) {
    this.width = width;
    this.height = height;

    this.preview = preview;
  }
}
