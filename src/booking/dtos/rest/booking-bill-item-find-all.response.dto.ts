import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { BookingBillItemDto } from '../booking-bill-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BookingBillItemFindAllResponseDto extends PagingPaginatedResposneDto<BookingBillItemDto> {
  @ApiProperty()
  totalAmount: number;

  constructor(
    totalAmount: number,
    limit: number,
    count: number,
    objs: BookingBillItemDto[],
  ) {
    super(limit, count, objs);

    this.totalAmount = totalAmount;
  }
}
