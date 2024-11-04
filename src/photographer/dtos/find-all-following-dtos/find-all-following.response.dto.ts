import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { FollowDto } from '../following-dto';

export class FindAllFollowResponseDto extends PagingPaginatedResposneDto<FollowDto> {}
