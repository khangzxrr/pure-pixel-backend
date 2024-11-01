import { ApiPropertyOptional } from '@nestjs/swagger';
import { NewsfeedVisibility } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class NewsfeedFindAllDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional({
    enum: NewsfeedVisibility,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  visibility?: NewsfeedVisibility[];
}
