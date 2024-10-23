import { ApiProperty } from '@nestjs/swagger';

export class MakerDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  thumbnail: string;
}
