import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
