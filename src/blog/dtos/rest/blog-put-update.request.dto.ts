import { ApiProperty } from '@nestjs/swagger';
import { BlogStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class BlogPutUpdateRequestDto {
  @ApiProperty({
    enum: BlogStatus,
  })
  @IsEnum(BlogStatus)
  status: BlogStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUrl({})
  thumbnail: string;
}
