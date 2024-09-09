import { ApiProperty } from '@nestjs/swagger';

export class PhotoCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
