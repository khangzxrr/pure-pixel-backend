import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { UserDto } from '../user.dto';

export class UserFindAllResponseDto extends PagingPaginatedResposneDto<UserDto> {}
