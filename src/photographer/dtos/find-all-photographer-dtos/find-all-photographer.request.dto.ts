// import { ApiProperty } from '@nestjs/swagger';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class FindAllPhotographerRequestDto extends PagingPaginatedRequestDto {
  // @ApiProperty({
  //   description: 'search',
  //   required: false,
  // })
  // search?: string;
}
