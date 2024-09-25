import { ApiProperty } from '@nestjs/swagger';

export class PhotographerFilterDto {
  @ApiProperty({
    description: 'search',
    required: false,
  })
  search?: string;
}
