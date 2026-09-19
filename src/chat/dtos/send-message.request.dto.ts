import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty()
  @IsString()
  content!: string;
}
