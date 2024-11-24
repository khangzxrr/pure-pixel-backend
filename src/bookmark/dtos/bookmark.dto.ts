import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

export class BookmarkDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  photo: SignedPhotoDto;
}
