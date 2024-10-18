import { Prisma } from '@prisma/client';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class BookingBillItemFindAllRequestDto extends PagingPaginatedRequestDto {
  toWhere(): Prisma.BookingBillItemWhereInput {
    const where: Prisma.BookingBillItemWhereInput = {};

    return where;
  }
}
