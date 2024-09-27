import { ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoStatus, PhotoVisibility } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class FindAllPhotoFilterDto {
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

  @ApiPropertyOptional({
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    return Number(value);
  })
  skip: number;

  @ApiPropertyOptional({
    default: 20,
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => {
    return Number(value);
  })
  take: number;

  toWhere() {
    return {
      id: this.id,
      photographerId: this.photographerId,
      visibility: this.visibility,
      status: this.status,
    };
  }
}
