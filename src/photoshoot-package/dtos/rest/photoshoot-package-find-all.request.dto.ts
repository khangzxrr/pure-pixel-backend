import { Prisma } from '@prisma/client';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class PhotoshootPackageFindAllDto extends PagingPaginatedRequestDto {
  userId?: string;

  toWhere(): Prisma.PhotoshootPackageWhereInput {
    const where: Prisma.PhotoshootPackageWhereInput = {};

    if (this.userId) {
      where.userId = this.userId;
    }

    return where;
  }
}
