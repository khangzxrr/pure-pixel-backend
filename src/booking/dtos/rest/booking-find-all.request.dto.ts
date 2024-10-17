import { Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class BookingFindAllRequestDto extends PagingPaginatedRequestDto {
  @Exclude()
  photographerId?: string;

  @Exclude()
  userId?: string;

  toWhere(): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};
    if (this.photographerId) {
      where.photoshootPackage = {
        userId: this.photographerId,
      };
    }

    if (this.userId) {
      where.userId = this.userId;
    }

    return where;
  }
}
