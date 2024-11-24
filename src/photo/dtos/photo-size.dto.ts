import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhotoSizeDto {
  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiPropertyOptional()
  preview?: string;

  constructor(width: number, height: number, preview?: string) {
    this.width = width;
    this.height = height;

    this.preview = preview;
  }
}
