import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class NotificationDto {
  @ApiProperty()
  id: string;

  @Exclude()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({
    enum: NotificationStatus,
  })
  status: NotificationStatus;

  @ApiProperty({
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
