import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
  MinFileSize,
} from 'nestjs-form-data';

export class PhotoUploadRequestDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MinFileSize(4e6)
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  file: MemoryStoredFile;
}
