import { ApiProperty } from '@nestjs/swagger';
import { ChangeLogStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangeLogCreateRequestDto {
  @ApiProperty({
    example: '1.2.0',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'HTML produced by the rich text editor',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    enum: ChangeLogStatus,
  })
  @IsEnum(ChangeLogStatus)
  status!: ChangeLogStatus;
}
