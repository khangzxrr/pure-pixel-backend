import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { BlogDto } from '../blog.dto';

export class BlogFindAllResponseDto extends PagingPaginatedResposneDto<BlogDto> {}
