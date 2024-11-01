import { NewsfeedVisibility } from '@prisma/client';

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NewsfeedViewPermissionCreateDto } from './newsfeed-view-permission.create.dto';
import { Type } from 'class-transformer';

export class NewsfeedUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    enum: NewsfeedVisibility,
  })
  @IsOptional()
  @IsEnum(NewsfeedVisibility)
  visibility?: NewsfeedVisibility;

  @ApiPropertyOptional({
    isArray: true,
    type: NewsfeedViewPermissionCreateDto,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => NewsfeedViewPermissionCreateDto)
  permissions?: NewsfeedViewPermissionCreateDto[];

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  photos?: string[];
}
