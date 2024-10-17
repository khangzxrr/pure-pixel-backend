import { PhotoshootPackageStatus, Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class PhotoshootPackageFindAllDto extends PagingPaginatedRequestDto {
  @Exclude()
  userId?: string;

  @Exclude()
  status?: PhotoshootPackageStatus;

  toWhere(): Prisma.PhotoshootPackageWhereInput {
    const where: Prisma.PhotoshootPackageWhereInput = {};

    if (this.userId) {
      where.userId = this.userId;
    }

    if (this.status) {
      where.status = this.status;
    }

    return where;
  }
}
