import { ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoStatus, PhotoVisibility } from '@prisma/client';

export class PhotoFindAllFilterDto {
  @ApiPropertyOptional()
  id: string;
  @ApiPropertyOptional()
  photographerId: string;

  @ApiPropertyOptional()
  visibility: PhotoVisibility;

  @ApiPropertyOptional()
  status: PhotoStatus;
}
