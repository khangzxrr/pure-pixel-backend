import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class UploadFileDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  file: MemoryStoredFile;
}
