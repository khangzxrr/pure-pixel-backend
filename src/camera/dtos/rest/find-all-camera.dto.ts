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

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByTotalPhotoCount?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByTotalUserCount?: Prisma.SortOrder;

  toWhere() {
    const where: Prisma.CameraWhereInput = {};

    if (this.search) {
      where.OR = [
        {
          name: {
            contains: this.search,
            mode: 'insensitive',
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

    if (this.orderByTotalPhotoCount) {
      console.log(`sort by total photo`);
      orderBy.push({
        photos: {
          _count: this.orderByTotalPhotoCount,
        },
      });
    }

    if (this.orderByTotalUserCount) {
      orderBy.push({
        cameraOnUsers: {
          _count: this.orderByTotalUserCount,
        },
      });
    }

    return orderBy;
  }
}
