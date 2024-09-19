import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class PaginatedQueryRequestDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  @ApiProperty({
    example: 10,
    description: 'Limit number of records',
    required: false,
  })
  readonly limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  @ApiProperty({
    example: 10,
    description: 'Page number',
    required: false,
  })
  readonly page?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  @ApiProperty({
    example: 10,
    description: 'Limit number of records',
    required: false,
  })
  readonly offset?: number;
}
