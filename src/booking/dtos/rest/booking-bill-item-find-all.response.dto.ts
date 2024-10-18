import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { BookingBillItemDto } from '../booking-bill-item.dto';

export class BookingBillItemFindAllResponseDto extends PagingPaginatedResposneDto<BookingBillItemDto> {}
