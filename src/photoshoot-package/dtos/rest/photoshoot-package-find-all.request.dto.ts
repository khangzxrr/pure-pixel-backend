import { ApiProperty } from '@nestjs/swagger';
import { PhotoshootPackageStatus, Prisma } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class PhotoshootPackageFindAllDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
    enum: PhotoshootPackageStatus,
  })
  @IsOptional()
  @IsEnum(PhotoshootPackageStatus)
  status?: PhotoshootPackageStatus;

  toWhere(): Prisma.PhotoshootPackageWhereInput {
    const where: Prisma.PhotoshootPackageWhereInput = {};

    if (this.status) {
      where.status = this.status;
    }

    return where;
  }
}
