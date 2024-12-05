import { ApiProperty } from '@nestjs/swagger';

export class PhotoWithSellingCountDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  count: number;
}
