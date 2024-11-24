import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min } from 'class-validator';
import { UserDto } from 'src/user/dtos/user.dto';

export class PhotoshootPackageReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @Min(0)
  @IsNumber()
  @Max(5)
  star: number;

  @ApiProperty()
  @IsString()
  description: string;

  @Exclude()
  photoshootPackageId: string;

  @Exclude()
  bookingId: string;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;
}
