import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { Utils } from 'src/infrastructure/utils/utils';

export class UserFindAllRequestDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  toWhere() {
    const where: Prisma.UserWhereInput = {};

    if (this.search) {
      where.OR = [
        {
          id: {
            contains: this.search,
          },
        },
        {
          name: {
            contains: this.search,
          },
        },
        {
          normalizedName: {
            contains: Utils.normalizeText(this.search),
          },
        },
        {
          mail: {
            contains: this.search,
          },
        },
      ];
    }

    return where;
  }

  toOrderBy() {
    const orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    if (this.orderByCreatedAt) {
      orderBy.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    return orderBy;
  }
}
