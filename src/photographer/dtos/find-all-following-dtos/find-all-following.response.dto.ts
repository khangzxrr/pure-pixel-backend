import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { FollowingDto } from '../following-dto';

export class FindAllFollowingResponseDto extends PagingPaginatedResposneDto<FollowingDto> {}
