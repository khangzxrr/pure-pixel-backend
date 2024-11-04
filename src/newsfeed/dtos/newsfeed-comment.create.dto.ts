import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NewsfeedCommentCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
