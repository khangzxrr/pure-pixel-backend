import { ApiProperty } from '@nestjs/swagger';
import { $Enums, ChangeLog } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class ChangeLogDto implements ChangeLog {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  status!: $Enums.ChangeLogStatus;

  @ApiProperty({
    nullable: true,
  })
  publishedAt!: Date | null;

  @Exclude()
  authorId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
