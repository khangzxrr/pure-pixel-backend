import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { ChangeLogDto } from '../change-log.dto';

export class ChangeLogFindAllResponseDto extends PagingPaginatedResposneDto<ChangeLogDto> {}
