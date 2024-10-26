import { ApiProperty } from '@nestjs/swagger';
import { Min } from 'class-validator';

export class PhotoResolution {
  @ApiProperty()
  @Min(1)
  pixels: number;
}
