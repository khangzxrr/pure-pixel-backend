import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, UpgradePackageStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class UpgradePackageFindAllDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    required: false,
    enum: UpgradePackageStatus,
  })
  @IsOptional()
  @IsEnum(UpgradePackageStatus)
  status?: UpgradePackageStatus;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByPrice?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpdatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByMinOrderMonth?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByMaxPhotoQuota?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByMaxPackageCount?: Prisma.SortOrder;

  toWhere(): Prisma.UpgradePackageWhereInput {
    const where: Prisma.UpgradePackageWhereInput = {};

    if (this.id) {
      where.id = {
        contains: this.id,
      };
    }

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
          id: {
            contains: this.search,
          },
        },
      ];
    }

    if (this.status) {
      where.status = this.status;
    }

    return where;
  }

  toOrderBy(): Prisma.UpgradePackageOrderByWithRelationInput {
    return {
      price: this.orderByPrice,
      minOrderMonth: this.orderByMinOrderMonth,
      createdAt: this.orderByCreatedAt,
      updatedAt: this.orderByUpdatedAt,
      maxPhotoQuota: this.orderByMaxPhotoQuota,
      maxPackageCount: this.orderByMaxPackageCount,
    };
  }
}
