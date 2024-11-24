import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class PhotoTagDto {
  @Exclude()
  id: string;

  @Exclude()
  photoId: string;

  @ApiProperty()
  name: string;
}
