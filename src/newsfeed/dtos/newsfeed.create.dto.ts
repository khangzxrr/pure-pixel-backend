import { ApiProperty } from '@nestjs/swagger';
import { NewsfeedViewPermission, NewsfeedVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NewsfeedViewPermissionCreateDto } from './newsfeed-view-permission.create.dto';

export class NewsfeedCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: NewsfeedVisibility,
  })
  @IsNotEmpty()
  @IsEnum(NewsfeedVisibility)
  visibility: NewsfeedVisibility;

  @ApiProperty({
    isArray: true,
    type: NewsfeedViewPermissionCreateDto,
  })
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => NewsfeedViewPermissionCreateDto)
  permissions: NewsfeedViewPermissionCreateDto[];

  @ApiProperty({
    isArray: true,
    type: String,
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  photos: string[];
}
