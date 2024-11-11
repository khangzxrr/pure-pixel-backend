import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsNotEmpty } from 'class-validator';
import { Prisma } from '@prisma/client';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class FindNextPhotoFilterDto {
  @ApiProperty()
  @IsNotEmpty()
  cursor: string;

  @ApiProperty()
  @ToBoolean()
  @IsBoolean()
  forward: boolean;

  toCursor(): Prisma.PhotoWhereUniqueInput {
    return {
      id: this.cursor,
    };
  }
}
