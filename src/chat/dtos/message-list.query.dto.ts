import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MessageListQueryDto {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  take?: number = 30;

  @ApiPropertyOptional({
    description: 'id of the oldest loaded message, only older messages are returned',
  })
  @IsOptional()
  @IsUUID()
  beforeId?: string;
}
