import { ApiProperty } from '@nestjs/swagger';
import { Prisma, UpgradePackageStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class FindAllDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  searchById?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  searchByName?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  searchByPrice?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  searchByMinOrderMonth?: number;

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

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByMaxBookingPhotoQuota?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByMaxBookingVideoQuota?: Prisma.SortOrder;

  toWhere(): Prisma.UpgradePackageWhereInput {
    return {
      id: {
        contains: this.searchById,
      },
      name: {
        search: this.searchByName,
      },
      status: this.status,
      price: this.searchByPrice,
      minOrderMonth: this.searchByMinOrderMonth,
    };
  }

  toOrderBy(): Prisma.UpgradePackageOrderByWithRelationInput {
    return {
      price: this.orderByPrice,
      minOrderMonth: this.orderByMinOrderMonth,
      createdAt: this.orderByCreatedAt,
      updatedAt: this.orderByUpdatedAt,
      maxPhotoQuota: this.orderByMaxPhotoQuota,
      maxPackageCount: this.orderByMaxPackageCount,
      maxBookingPhotoQuota: this.orderByMaxBookingPhotoQuota,
      maxBookingVideoQuota: this.orderByMaxBookingVideoQuota,
    };
  }
}
