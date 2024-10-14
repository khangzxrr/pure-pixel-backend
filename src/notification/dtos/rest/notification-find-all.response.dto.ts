import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { NotificationDto } from '../notification.dto';

export class NotificationFindAllResponseDto extends PagingPaginatedResposneDto<NotificationDto> {}
