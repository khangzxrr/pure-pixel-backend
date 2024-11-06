import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by id, leave blank if get current logged user',
    example: '5f9d5b6b-9e1b-4e9f-9f9f-9e9e9e9e9e9e',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
