import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class FindAllPhotographerRequestDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByPhotoCount?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByVoteCount?: Prisma.SortOrder;

  toWhere() {
    const where: Prisma.UserWhereInput = {};

    if (this.search) {
      where.normalizedName = {
        contains: this.search,
      };
    }

    return where;
  }

  toOrderBy() {
    const orderBys: Prisma.UserOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBys.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    if (this.orderByPhotoCount) {
      orderBys.push({
        photos: {
          _count: this.orderByPhotoCount,
        },
      });
    }

    return orderBys;
  }
}
