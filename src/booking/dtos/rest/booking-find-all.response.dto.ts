import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { BookingDto } from '../booking.dto';

export class BookingFindAllResponseDto extends PagingPaginatedResposneDto<BookingDto> {}
