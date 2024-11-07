import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class UserFindAllRequestDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional({})
  @IsArray()
  @IsNotEmpty({ each: true })
  roles?: string[];
}
