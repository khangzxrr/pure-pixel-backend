import { ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoshootPackageStatus, Prisma } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToArray } from 'src/infrastructure/transforms/to-array';

export class PhotoshootPackageFindAllDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    isArray: true,
    enum: PhotoshootPackageStatus,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(PhotoshootPackageStatus, { each: true })
  statuses?: PhotoshootPackageStatus[];

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

    if (this.search) {
      where.OR = [
        {
          userId: {
            contains: this.search,
          },
        },
        {
          id: {
            contains: this.search,
          },
        },
        {
          title: {
            contains: this.search,
          },
        },
        {
          subtitle: {
            contains: this.search,
          },
        },
        {
          description: {
            contains: this.search,
          },
        },
      ];
    }

    if (this.statuses) {
      where.status = {
        in: this.statuses,
      };
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
