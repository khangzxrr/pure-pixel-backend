import { ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoStatus, PhotoVisibility } from '@prisma/client';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class FindAllPhotoFilterDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  id: string;

  @ApiPropertyOptional()
  photographerId: string;

  @ApiPropertyOptional()
  visibility: PhotoVisibility;

  @ApiPropertyOptional()
  status: PhotoStatus;

  @ApiPropertyOptional()
  cursorId: string;

  toWhere() {
    return {
      id: this.id,
      photographerId: this.photographerId,
      visibility: this.visibility,
      status: this.status,
    };
  }
}
