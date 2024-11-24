import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { NewsfeedCommentDto } from '../newsfeed-comment.dto';

export class NewsfeedCommentFindAllResponseDto extends PagingPaginatedResposneDto<NewsfeedCommentDto> {}
