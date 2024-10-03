import { ApiProperty } from '@nestjs/swagger';

export class ResolutionDto {
  @ApiProperty()
  pixels: number;

  @ApiProperty()
  resolution: string;
}
