import { ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoshootPackageStatus, Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class PhotoshootPackageFindAllDto extends PagingPaginatedRequestDto {
  @Exclude()
  userId?: string;

  @Exclude()
  status?: PhotoshootPackageStatus;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  orderByCreateAt?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  orderByBookingCount?: Prisma.SortOrder;

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

  toOrderBy(): Prisma.PhotoshootPackageOrderByWithRelationInput[] {
    const orderBy: Prisma.PhotoshootPackageOrderByWithRelationInput[] = [];

    if (this.orderByCreateAt) {
      orderBy.push({
        createdAt: this.orderByCreateAt,
      });
    } else {
      //always order by desc as default
      orderBy.push({
        createdAt: 'desc',
      });
    }

    if (this.orderByBookingCount) {
      orderBy.push({
        bookings: {
          _count: this.orderByBookingCount,
        },
      });
    }

    return orderBy;
  }
}
