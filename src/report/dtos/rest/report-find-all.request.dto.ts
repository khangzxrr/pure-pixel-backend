import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, ReportStatus, ReportType } from '@prisma/client';

import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToArray } from 'src/infrastructure/transforms/to-array';

export class ReportFindAllRequestDto extends PagingPaginatedRequestDto {
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
    enum: ReportStatus,
    isArray: true,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(ReportStatus, { each: true })
  reportStatuses?: ReportStatus[];

  @ApiProperty({
    required: false,
    isArray: true,
    enum: ReportType,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(ReportType, { each: true })
  reportTypes?: ReportType[];

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpdatedAt: Prisma.SortOrder;

  toWhere(): Prisma.ReportWhereInput {
    const where: Prisma.ReportWhereInput = {};

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
          userId: {
            contains: this.search,
          },
        },
        {
          content: {
            contains: this.search,
          },
        },
        {
          referenceId: {
            contains: this.search,
          },
        },
      ];
    }

    if (this.reportStatuses) {
      where.reportStatus = {
        in: this.reportStatuses,
      };
    }

    if (this.reportTypes) {
      where.reportType = {
        in: this.reportTypes,
      };
    }

    return where;
  }

  toOrderBy(): Prisma.ReportOrderByWithRelationInput[] {
    const orderBy: Prisma.ReportOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBy.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    if (this.orderByUpdatedAt) {
      orderBy.push({
        updatedAt: this.orderByUpdatedAt,
      });
    }

    return orderBy;
  }
}
