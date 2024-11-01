import { ApiProperty } from '@nestjs/swagger';
import { NewsfeedVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';
import { UserDto } from 'src/user/dtos/user.dto';

export class NewsfeedDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @Type(() => SignedPhotoDto)
  photos: SignedPhotoDto[];

  @ApiProperty()
  visibility: NewsfeedVisibility;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;
}
