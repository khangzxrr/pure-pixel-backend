import { ApiProperty } from '@nestjs/swagger';
import { NotificationReferenceType, NotificationType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class NotificationCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    enum: NotificationReferenceType,
  })
  @IsEnum(NotificationReferenceType)
  referenceType: NotificationReferenceType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payload: object;
}
