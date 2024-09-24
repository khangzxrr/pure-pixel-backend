import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PresignedUploadUrlRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;
}
