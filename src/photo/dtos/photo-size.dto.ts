import { ApiProperty } from '@nestjs/swagger';

export class PhotoSizeDto {
  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}
