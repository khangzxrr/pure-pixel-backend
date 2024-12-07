import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class FindAllCameraDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional({})
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  toWhere() {
    const where: Prisma.CameraWhereInput = {};

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
          description: {
            contains: this.search,
          },
        },
      ];
    }

    return where;
  }

  toOrderBy() {
    const orderBy: Prisma.CameraOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBy.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    return orderBy;
  }
}
