import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Blog } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class BlogDto implements Blog {
  @ApiProperty()
  id: string;

  @Exclude()
  userId: string;

  @ApiProperty()
  status: $Enums.BlogStatus;

  @ApiProperty()
  content: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
