import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray } from 'class-validator';

export class PresignedUploadUrlRequest {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty({})
  filenames: string[];
}
