import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { NewsfeedDto } from '../newsfeed.dto';

export class NewsfeedFindAllResponseDto extends PagingPaginatedResposneDto<NewsfeedDto> {}
