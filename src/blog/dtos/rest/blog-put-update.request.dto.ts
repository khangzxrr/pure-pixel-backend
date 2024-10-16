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
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  thumbnailFile: Express.Multer.File;
}
