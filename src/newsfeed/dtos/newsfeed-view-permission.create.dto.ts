import { ApiProperty } from '@nestjs/swagger';
import { ViewPermission } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class NewsfeedViewPermissionCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: ViewPermission,
  })
  @IsNotEmpty()
  @IsEnum(ViewPermission)
  permission: ViewPermission;
}
